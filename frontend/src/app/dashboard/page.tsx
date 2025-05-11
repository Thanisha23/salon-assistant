"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import api from "@/lib/api";
import { knowledgeApi } from "@/lib/knowledge-api";
import HelpRequestCard from "../components/HelpRequestCard";
import RequestHistoryCard from "../components/RequestHistoryCard";
import StatusTabs from "../components/StatusTabs";
import NoDataAnimation from "../components/NoDataAnimation";
import type { HelpRequest, KnowledgeBaseEntry } from "@/app/types/help-request";

export default function Dashboard() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [showKnowledgeBase, setShowKnowledgeBase] = useState<boolean>(false);
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

  const fetchKnowledgeBase = async () => {
    try {
      const data = await knowledgeApi.getAll();
      setKnowledgeBase(data);
    } catch (err) {
      console.error("Failed to fetch knowledge base:", err);
      toast.error("Failed to load knowledge base");
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

  const handleAddToKnowledgeBase = async (request: HelpRequest) => {
    try {
      toast.promise(
        knowledgeApi.create({
          question: request.question,
          answer: request.answer || "",
          source: `learned-from-request-${request.id}`
        }),
        {
          loading: "Adding to knowledge base...",
          success: () => {
            fetchKnowledgeBase();
            return "Added to knowledge base";
          },
          error: "Failed to add to knowledge base",
        }
      );
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
    }
  };

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const resolvedCount = requests.filter(r => r.status === "RESOLVED").length;
  const unresolvedCount = requests.filter(r => r.status === "UNRESOLVED").length;

  useEffect(() => {
    fetchRequests();
    fetchKnowledgeBase();
    
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
        <div className="space-x-3">
          <button 
            onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
            className="px-4 cursor-pointer py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {showKnowledgeBase ? "Back to Requests" : "View Knowledge Base"}
          </button>
          <button 
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {showKnowledgeBase ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Knowledge Base</h2>
            {/* <button
              className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
              onClick={() => {
                toast.info("Knowledge base entry creation will be implemented here");
              }}
            >
              Add New Entry
            </button> */}
          </div>
          
          {knowledgeBase.length === 0 ? (
            <NoDataAnimation message="No knowledge base entries yet" />
          ) : (
            <div className="space-y-4">
              {knowledgeBase.map((entry) => (
                <div key={entry.id || entry.question} className="bg-white rounded-lg p-4 shadow">
                  <div className="font-medium mb-2">{entry.question}</div>
                  <div className="text-gray-600">{entry.answer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <StatusTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingCount={pendingCount}
            resolvedCount={resolvedCount}
            unresolvedCount={unresolvedCount}
          />
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : filteredRequests.length === 0 ? (
            <NoDataAnimation message={`No ${activeTab.toLowerCase()} help requests available`} />
          ) : activeTab === "PENDING" ? (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <HelpRequestCard
                  key={req.id}
                  request={req}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div key={req.id} className="relative">
                  <RequestHistoryCard request={req} />
                  {activeTab === "RESOLVED" && req.answer && (
                    <></>
                    // <button
                    //   onClick={() => handleAddToKnowledgeBase(req)}
                    //   className="absolute top-2 right-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200 hover:bg-green-100"
                    // >
                    //   Add to Knowledge Base
                    // </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}