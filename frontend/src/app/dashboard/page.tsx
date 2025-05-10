"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import api  from "@/lib/api";
import HelpRequestCard from "../components/HelpRequestCard";
import type { HelpRequest } from "@/app/types/help-request";
import dynamic from "next/dynamic";

const NoDataAnimation = dynamic(
  () => import('@/app/components/NoDataAnimation'),
  { ssr: false }
);

export default function Dashboard() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/helpreq");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load help requests. Please try again.");
      toast.error("Failed to load help requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, answer: string) => {
    try {
      toast.promise(
        api.patch(`/helpreq/${id}`, {
          answer,
          status: "RESOLVED",
        }),
        {
          loading: "Resolving request...",
          success: () => {
            fetchRequests(); 
            return "Request resolved successfully";
          },
          error: "Failed to resolve request",
        }
      );
    } catch (error) {
      console.error("Error resolving request:", error);
    }
  };

 
  useEffect(() => {
    fetchRequests();
    
    //30 seconds interval
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <button 
          onClick={fetchRequests}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : requests.filter(r => r.status === "PENDING").length === 0 ? (
        <NoDataAnimation message="No pending help requests available" />
      ) : (
        <div className="space-y-4">
          {requests
            .filter((r) => r.status === "PENDING")
            .map((req) => (
              <HelpRequestCard
                key={req.id}
                request={req}
                onResolve={handleResolve}
              />
            ))}
        </div>
      )}
    </div>
  );
}