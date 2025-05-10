"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import noDataAnimation from "@/assets/no-data.json";

interface NoDataAnimationProps {
  message?: string;
}

export default function NoDataAnimation({ 
  message = "No data available" 
}: NoDataAnimationProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-64 h-64">
        {isMounted ? (
          <Lottie animationData={noDataAnimation} loop={true} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
          </div>
        )}
      </div>
      <p className="text-gray-500 mt-4 text-center">{message}</p>
    </div>
  );
}