export interface HelpRequest {
  id: string;
  question: string;
  answer?: string;
  status: "PENDING" | "RESOLVED" | "UNRESOLVED";
  userId?: string;
  caller_id?: string;
  request_id?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface KnowledgeBaseEntry {
  id?: string;
  question: string;
  answer: string;
  addedAt?: string;
  source?: string; 
}