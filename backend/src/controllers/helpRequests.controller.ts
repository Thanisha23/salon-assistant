import { Request, Response } from "express";
import { db } from "../db";

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
  const helpRequests = await db.helpRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(helpRequests);
  return;
};

export const resolveHelpRequest = async (req:Request,res: Response) => {
    const { id } = req.params;
    const { answer, status } = req.body;

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

    const updateHelpRequest = await db.helpRequest.update({
        where: {
            id,
        },
        data: {
            answer,
            status,
        },
    });


  if (status === "RESOLVED") {
    try {
      const WebSocket = require('ws');
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
    } catch (error) {
      console.error("Failed to notify via WebSocket:", error);
    }
  }
  
  res.status(200).json(updateHelpRequest);
  return;
}