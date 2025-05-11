"use client";

import { useMemo } from "react";
import type { HelpRequest } from "@/app/types/help-request";
import { Clock, Calendar, User, CheckCircle2, AlertCircle } from "lucide-react";

interface RequestHistoryCardProps {
  request: HelpRequest;
}

export default function RequestHistoryCard({ request }: RequestHistoryCardProps) {
  const formattedCreatedAt = new Date(request.createdAt).toLocaleString();
  const formattedUpdatedAt = new Date(request.updatedAt).toLocaleString();
  
  const isResolved = request.status === "RESOLVED";

  const resolutionTime = useMemo(() => {
    if (!isResolved || !request.resolvedAt) return null;
    
    const created = new Date(request.createdAt).getTime();
    const resolved = new Date(request.resolvedAt).getTime();
    const diffMs = resolved - created;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes} minutes`;
  }, [request.createdAt, request.resolvedAt, isResolved]);
  
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg ${
      isResolved ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-500'
    }`}>
      <div className="p-5 border-b border-gray-100 relative">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-gray-800 pr-20">{request.question}</h3>
          <span className={`absolute top-5 right-5 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
            isResolved 
              ? 'bg-green-100 text-green-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {isResolved ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {request.status}
          </span>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={14} className="mr-1.5 flex-shrink-0" />
          <span>Created: {formattedCreatedAt}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={14} className="mr-1.5 flex-shrink-0" />
          <span>Updated: {formattedUpdatedAt}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 col-span-full">
          <User size={14} className="mr-1.5 flex-shrink-0" />
          <span>From: {request.userId || request.caller_id || "Anonymous"}</span>
        </div>
      </div>
      
      {isResolved && request.answer && (
        <div className="p-5">
          {resolutionTime && (
            <div className="mb-3 text-xs inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              <Clock size={12} className="mr-1" /> Resolved in {resolutionTime}
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CheckCircle2 size={14} className="mr-1.5 text-green-500" />
              Answer:
            </h4>
            <p className="text-gray-800 whitespace-pre-wrap">{request.answer}</p>
          </div>
          <div className="mt-3 text-xs text-green-700 flex items-center">
            <CheckCircle2 size={12} className="mr-1" />
            This answer has been added to the knowledge base
          </div>
        </div>
      )}
      
      {!isResolved && request.status === "UNRESOLVED" && (
        <div className="p-5">
          <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
            <p className="text-amber-800 text-sm">
              This request was not resolved within the expected timeframe and has been automatically marked as unresolved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}