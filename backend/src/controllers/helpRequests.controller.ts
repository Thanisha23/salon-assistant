import { Request, Response } from "express";
import { db } from "../db";
import WebSocket from "ws";

const HELP_REQUEST_TIMEOUT_MS = 24 * 60 * 60 * 1000; 

export const checkTimeoutRequests = async () => {
  console.log("Checking for timed-out help requests...");
  
  try {
    const timeoutThreshold = new Date(Date.now() - HELP_REQUEST_TIMEOUT_MS);
    
    const timedOutRequests = await db.helpRequest.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: timeoutThreshold
        }
      },
      data: {
        status: "UNRESOLVED"
      }
    });
    
    if (timedOutRequests.count > 0) {
      console.log(`Marked ${timedOutRequests.count} help requests as UNRESOLVED due to timeout`);
    }
  } catch (error) {
    console.error("Error checking timed-out requests:", error);
  }
};

setInterval(checkTimeoutRequests, 60 * 60 * 1000);
checkTimeoutRequests();

export const helpRequests = async (req: Request, res: Response) => {
  const { question, caller_id, request_id } = req.body;
  if (!question) {
    res.status(400).json({
      error: "Question is required",
    });
    return;
  }

  const helpRequest = await db.helpRequest.create({
    data: {
      question,
      caller_id: caller_id || "anonymous",
      request_id: request_id || undefined,
    },
  });

  res.status(201).json({
    ...helpRequest,
    request_id: helpRequest.request_id || request_id || helpRequest.id,
  });
  return;
};

export const getHelpRequests = async (req: Request, res: Response) => {
  await checkTimeoutRequests();
  
  const helpRequests = await db.helpRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(helpRequests);
  return;
};

export const resolveHelpRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { answer, status, resolvedBy } = req.body;

  if (!answer || !status) {
    res.status(400).json({
      error: "Answer and status are required",
    });
    return;
  }

  const helpRequest = await db.helpRequest.findUnique({
    where: { id },
  });
  
  if (!helpRequest) {
    res.status(404).json({
      error: "Help request not found",
    });
    return;
  }

  const updateData: any = {
    answer,
    status,
  };
  
  if (helpRequest.status === "PENDING" && 
      (status === "RESOLVED" || status === "UNRESOLVED")) {
    updateData.resolvedAt = new Date();
    
    if (resolvedBy) {
      updateData.resolvedBy = resolvedBy;
    }
  }

  const updateHelpRequest = await db.helpRequest.update({
    where: { id },
    data: updateData,
  });

if (status === "RESOLVED") {
  try {
    const ws = new WebSocket("ws://localhost:8766");
    
    ws.on("open", () => {
      const message = JSON.stringify({
        type: "resolve",
        request_id: helpRequest.request_id || id,
        db_id: id,
        answer: answer
      });
      
      ws.send(message);
      ws.close();
    });
    
    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
    });
    
    try {
      const { getKnowledgeBase, addKnowledgeEntry } = require('../controllers/knowledge.controller');
      await db.knowledgeBaseEntry.upsert({
        where: {
          question: helpRequest.question
        },
        update: {
          answer: answer
        },
        create: {
          question: helpRequest.question,
          answer: answer,
          source: `auto-learned-from-request-${id}`
        }
      });
      
      const fs = require('fs').promises;
      const path = require('path');
      
      const entries = await db.knowledgeBaseEntry.findMany();
      const formattedEntries = entries.map(entry => ({
        question: entry.question,
        answer: entry.answer
      }));
      
      const KNOWLEDGE_BASE_PATH = path.resolve(__dirname, '../../../ai-agent/knowledge_base.json');
      await fs.writeFile(KNOWLEDGE_BASE_PATH, JSON.stringify(formattedEntries, null, 2), 'utf-8');
      
      console.log(`✅ Knowledge base updated with answer to "${helpRequest.question}"`);
    } catch (kbError) {
      console.error("Failed to update knowledge base:", kbError);
    }
  } catch (error) {
    console.error("Failed to notify via WebSocket:", error);
  }
}
  
  res.status(200).json(updateHelpRequest);
  return;
};
export const getHelpRequest = async (req: Request, res: Response) => {
  const { id } = req.params;

  const helpRequest = await db.helpRequest.findUnique({
    where: { id },
  });

  if (!helpRequest) {
    res.status(404).json({
      error: "Help request not found",
    });
    return;
  }

  res.status(200).json(helpRequest);
  return;
};