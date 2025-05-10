export interface HelpRequest {
    id: string;
    question: string;
    answer?: string;
    status: "PENDING" | "RESOLVED";
    userId?: string;
    createdAt: string;
    updatedAt: string;
  }