import { Request, Response } from "express";
import { db } from "../db";
import fs from 'fs/promises';
import path from 'path';

const KNOWLEDGE_BASE_PATH = path.resolve(__dirname, '../../../ai-agent/knowledge_base.json');

console.log('Knowledge base path:', KNOWLEDGE_BASE_PATH);

const syncKnowledgeBaseToJson = async () => {
  try {
    const entries = await db.knowledgeBaseEntry.findMany();
    const formattedEntries = entries.map(entry => ({
      question: entry.question,
      answer: entry.answer
    }));
    console.log(`Syncing ${entries.length} entries to knowledge base JSON file`);
    console.log('Knowledge base path:', KNOWLEDGE_BASE_PATH);

    await fs.writeFile(KNOWLEDGE_BASE_PATH, JSON.stringify(formattedEntries, null, 2), 'utf-8');
    console.log('Knowledge base file updated successfully');
  } catch (error) {
    console.error('Failed to sync knowledge base to JSON:', error);
  }
};

export const testKnowledgeRoute = (req: Request, res: Response) => {
  try {
    console.log('Test knowledge route accessed');
    console.log('Knowledge base path:', KNOWLEDGE_BASE_PATH);
    
    fs.access(KNOWLEDGE_BASE_PATH)
      .then(() => console.log('Knowledge base file exists'))
      .catch(err => console.error('Knowledge base file not found:', err));
    
    res.status(200).json({ 
      message: 'Knowledge route test successful',
      path: KNOWLEDGE_BASE_PATH
    });
  } catch (error) {
    console.error('Error in test knowledge route:', error);
    res.status(500).json({ error: 'Test route failed' });
  }
};

export const getKnowledgeBase = async (_req: Request, res: Response) => {
  try {
    const knowledgeBase = await db.knowledgeBaseEntry.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    res.status(200).json(knowledgeBase);
  } catch (error) {
    console.error('Failed to read knowledge base:', error);
    res.status(500).json({
      error: "Failed to read knowledge base",
    });
  }
};

export const addKnowledgeEntry = async (req: Request, res: Response) => {
  const { question, answer, source, helpRequestId } = req.body;
  
  if (!question || !answer) {
    res.status(400).json({
      error: "Question and answer are required",
    });
    return;
  }
  
  try {
    const existingEntry = await db.knowledgeBaseEntry.findFirst({
      where: {
        question: {
          equals: question,
          mode: 'insensitive'  
        }
      }
    });
    
    if (existingEntry) {
      res.status(400).json({
        error: "A similar question already exists in the knowledge base",
      });
      return;
    }
    const newEntry = await db.knowledgeBaseEntry.create({
      data: {
        question,
        answer,
        source,
        helpRequest: helpRequestId ? {
          connect: { id: helpRequestId }
        } : undefined
      }
    });
    
    await syncKnowledgeBaseToJson();
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Failed to update knowledge base:', error);
    res.status(500).json({
      error: "Failed to update knowledge base",
    });
    return;
  }
};

export const updateKnowledgeEntry = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  
  if (!question || !answer) {
    res.status(400).json({
      error: "Question and answer are required",
    });
    return;
  }
  
  try {
    const existingEntry = await db.knowledgeBaseEntry.findUnique({
      where: { id }
    });
    
    if (!existingEntry) {
      res.status(404).json({
        error: "Knowledge entry not found",
      });
      return;
    }
    
    const updatedEntry = await db.knowledgeBaseEntry.update({
      where: { id },
      data: {
        question,
        answer,
      }
    });
    
    await syncKnowledgeBaseToJson();
    
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Failed to update knowledge base entry:', error);
    res.status(500).json({
      error: "Failed to update knowledge base entry",
    });
    return;
  }
};

export const addFromHelpRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const helpRequest = await db.helpRequest.findUnique({
      where: { id },
    });
    
    if (!helpRequest || !helpRequest.question || !helpRequest.answer) {
      res.status(404).json({
        error: "Help request not found or missing question/answer",
      });
      return;
    }
    
    const existingEntry = await db.knowledgeBaseEntry.findFirst({
      where: {
        question: {
          equals: helpRequest.question,
          mode: 'insensitive' 
        }
      }
    });
    
    if (existingEntry) {
      res.status(400).json({
        error: "A similar question already exists in the knowledge base",
      });
      return;
    }
    
    const newEntry = await db.knowledgeBaseEntry.create({
      data: {
        question: helpRequest.question,
        answer: helpRequest.answer,
        source: `learned-from-request-${helpRequest.id}`,
        helpRequest: {
          connect: { id: helpRequest.id }
        }
      }
    });
    
    await syncKnowledgeBaseToJson();
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Failed to learn from help request:', error);
    res.status(500).json({
      error: "Failed to learn from help request",
    });
    return;
  }
};