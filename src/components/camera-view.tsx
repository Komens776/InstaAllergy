
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraViewProps {
  onCapture: (dataUri: string) => void;
  onClose: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera(); 
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      let title = "Camera Error";
      let description = "Could not access the camera. Please try again.";
      if (err.name === "NotAllowedError") {
        title = "Camera Access Denied";
        description = "Please enable camera permissions in your browser settings to use this feature.";
      } else if (err.name === "NotFoundError") {
        title = "No Camera Found";
        description = "We couldn't find a camera on your device.";
      }
      toast({ variant: 'destructive', title, description });
    }
  }, [stopCamera, toast]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        onCapture(dataUri);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
             <Alert variant="destructive" className="w-auto max-w-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access and ensure no other app is using it. You may need to refresh the page or check your browser site settings.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCapture} disabled={hasPermission !== true}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
          Capture Photo
        </Button>
      </div>
    </div>
  );
}
