"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { HelpRequest } from "@/app/types/help-request";
import { Clock, User, MessageSquare, Loader2 } from "lucide-react";

interface HelpRequestCardProps {
  request: HelpRequest;
  onResolve: (id: string, answer: string) => Promise<void>;
}

export default function HelpRequestCard({
  request,
  onResolve,
}: HelpRequestCardProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timeElapsed = useMemo(() => {
    const created = new Date(request.createdAt).getTime();
    const now = Date.now();
    const diffMs = now - created;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m ago`;
    }
    return `${diffMins}m ago`;
  }, [request.createdAt]);

  const urgency = useMemo(() => {
    const created = new Date(request.createdAt).getTime();
    const now = Date.now();
    const diffMs = now - created;
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    if (diffHrs > 12) return "high"; 
    if (diffHrs > 4) return "medium"; 
    return "low"; 
  }, [request.createdAt]);
  
  const urgencyClasses = {
    low: "bg-green-50 border-green-200",
    medium: "bg-amber-50 border-amber-200",
    high: "bg-red-50 border-red-200"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error("Please provide an answer");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onResolve(request.id, answer);
      toast.success("Request resolved successfully");
    } catch (error) {
      console.error("Error resolving request:", error);
      toast.error("Failed to resolve request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(request.createdAt).toLocaleString();

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${urgencyClasses[urgency]} hover:shadow-lg transition-shadow`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-gray-800">{request.question}</h3>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
            <Clock size={12} className="mr-1" />
            {timeElapsed}
          </span>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <div className="flex items-center mr-4">
            <User size={14} className="mr-1" />
            <span>{request.userId || request.caller_id || "Anonymous"}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare size={14} className="mr-1" />
            <span>ID: {request.id.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <label
            htmlFor={`answer-${request.id}`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Answer
          </label>
          <textarea
            id={`answer-${request.id}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            required
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {urgency === "high" && (
              <span className="text-red-600 font-medium">⚠️ High priority - please resolve soon</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center cursor-pointer ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Submitting...
              </>
            ) : "Resolve Request"}
          </button>
        </div>
      </form>
    </div>
  );
}