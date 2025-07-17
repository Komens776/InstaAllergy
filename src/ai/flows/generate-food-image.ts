'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a food item.
 *
 * - generateFoodImage - A function that generates an image based on a food name.
 * - GenerateFoodImageInput - The input type for the generateFoodImage function.
 * - GenerateFoodImageOutput - The return type for the generateFoodImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateFoodImageInputSchema = z.object({
    foodName: z.string().describe("The name of the food to generate an image for, e.g., 'Jollof Rice'."),
});
export type GenerateFoodImageInput = z.infer<typeof GenerateFoodImageInputSchema>;


const GenerateFoodImageOutputSchema = z.object({
    imageDataUri: z.string().describe("The generated image as a data URI."),
});
export type GenerateFoodImageOutput = z.infer<typeof GenerateFoodImageOutputSchema>;


export async function generateFoodImage(input: GenerateFoodImageInput): Promise<GenerateFoodImageOutput> {
  return generateFoodImageFlow(input);
}

const generateFoodImageFlow = ai.defineFlow(
  {
    name: 'generateFoodImageFlow',
    inputSchema: GenerateFoodImageInputSchema,
    outputSchema: GenerateFoodImageOutputSchema,
  },
  async ({ foodName }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash-preview-image-generation'),
      prompt: `A vibrant, high-quality, professional food photograph of ${foodName}. The food should look appetizing and be presented on a clean, visually appealing background. Focus on realistic textures and colors.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!media?.url) {
        throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);
