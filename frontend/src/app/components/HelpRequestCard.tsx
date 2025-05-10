"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { HelpRequest } from "@/types/help-request";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error("Please provide an answer");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onResolve(request.id, answer);
    } catch (error) {
      console.error("Error resolving request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(request.createdAt).toLocaleString();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-gray-800">{request.question}</h3>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {request.status}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">Requested at: {formattedDate}</p>
        <p className="text-gray-600 mt-2">From: {request.userId || "Anonymous"}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label htmlFor={`answer-${request.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            Your Answer
          </label>
          <textarea
            id={`answer-${request.id}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Resolve Request"}
          </button>
        </div>
      </form>
    </div>
  );
}