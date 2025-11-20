"use client";

import { useEffect, useState } from "react";
import { createLucideIcon, LucideProps } from "lucide-react";
import { faceAlien } from "@lucide/lab"; // ✅ correct import

// 👽 Create a proper React component from the Lucide Lab icon definition
const FaceAlien = createLucideIcon("FaceAlien", faceAlien) as React.FC<LucideProps>;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1200);
    const completeTimer = setTimeout(() => onComplete(), 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center 
        bg-black transition-opacity duration-500 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      data-testid="splash-screen"
    >
      <FaceAlien className="h-24 w-24 text-green-500 animate-pulse drop-shadow-lg" />
    </div>
  );
}
