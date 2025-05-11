"use client";


import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface NoDataAnimationProps {
  message?: string;
}

export default function NoDataAnimation({ 
  message = "No data available" 
}: NoDataAnimationProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  
  useEffect(() => {
    import("@/assets/no-data.json").then(data => {
      setAnimationData(data.default);
      setIsMounted(true);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-64 h-64">
        {isMounted && animationData ? (
          <Lottie animationData={animationData} loop={true} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 rounded-full h-32 w-32"></div>
          </div>
        )}
      </div>
      <p className="text-gray-500 mt-4 text-center">{message}</p>
    </div>
  );
}