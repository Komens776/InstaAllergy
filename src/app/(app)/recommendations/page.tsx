
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { recommendSafeFoods, RecommendedFood } from "@/ai/flows/recommend-safe-foods";
import { generateFoodImage } from "@/ai/flows/generate-food-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EnrichedRecommendation = RecommendedFood & {
  imageUrl: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[] | null>(null);
  const [overallReasoning, setOverallReasoning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, allergens } = useUser();

  const handleGetRecommendations = async () => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "You're Offline",
        description: "An internet connection is required to get recommendations.",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations(null);
    setOverallReasoning(null);
    setError(null);

    try {
      if (allergens.length === 0) {
        toast({
          title: "Update Your Profile",
          description: "Please add at least one allergen to your profile to get recommendations.",
        });
        setIsLoading(false);
        return;
      }

      const result = await recommendSafeFoods({
        allergyProfile: {
          allergens: allergens,
          dietaryPreferences: "None specified",
        },
        nutritionGoals: "General healthy eating",
        cuisinePreference: cuisine || 'any',
      });
      
      const enrichedRecs = await Promise.all(
        result.recommendations.map(async (rec) => {
          try {
            const { imageDataUri } = await generateFoodImage({ foodName: `${rec.name}, ${rec.dataAiHint}` });
            return { ...rec, imageUrl: imageDataUri };
          } catch (e) {
            console.error(`Failed to generate image for ${rec.name}`, e);
            // Use a placeholder if image generation fails for a single item
            return { ...rec, imageUrl: `https://placehold.co/600x400.png` };
          }
        })
      );

      setRecommendations(enrichedRecs);
      setOverallReasoning(result.overallReasoning);

    } catch (err: any) {
      console.error("Failed to get recommendations:", err);
      if (err.message && err.message.includes('CONSUMER_SUSPENDED')) {
         setError("The API key is missing or invalid. Please add your own Google AI API key to the .env file as instructed in the README.");
      } else {
        setError("Could not fetch recommendations. Please try again later.");
      }
      toast({
        title: "Error",
        description: "Could not fetch recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Food Recommendations</h1>
        <p className="text-muted-foreground">
          Discover safe and delicious foods tailored to your profile.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Get Personalized Suggestions</CardTitle>
          <CardDescription>
            Based on your current allergy profile, we can suggest some foods that should be safe for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <span className="font-semibold">Your active allergies:</span> {allergens.join(", ") || "No allergies specified. You can set them in your profile."}
          </p>
           <div className="space-y-2">
            <Label htmlFor="cuisine">Preferred Cuisine (optional)</Label>
            <Input 
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., Ghanaian, Italian, Spicy"
              disabled={isLoading}
            />
           </div>
          <Button onClick={handleGetRecommendations} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Recommend Foods
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required: API Key Error</AlertTitle>
          <AlertDescription>
            {error} See the `README.md` file for instructions on how to get a free API key from Google AI Studio and add it to a `.env` file.
          </AlertDescription>
        </Alert>
      )}

      {recommendations && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
              <CardDescription>Here are some food items that fit your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((food) => (
                      <Card key={food.name} className="overflow-hidden group flex flex-col">
                        <div className="relative h-48 w-full">
                          <Image
                            src={food.imageUrl}
                            alt={food.name}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={food.dataAiHint}
                            className="transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle>{food.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <p className="text-sm text-muted-foreground">{food.description}</p>
                            <p className="text-sm"><span className="font-semibold">Why it's a good choice:</span> {food.reasoning}</p>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              ) : (
                <p>No specific recommendations found based on your current profile.</p>
              )}
            </CardContent>
          </Card>

          {overallReasoning && (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Our Reasoning</AlertTitle>
                <AlertDescription>
                    {overallReasoning}
                </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
