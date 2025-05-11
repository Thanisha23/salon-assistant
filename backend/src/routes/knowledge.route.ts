import { Router } from "express";
import { addFromHelpRequest, addKnowledgeEntry, getKnowledgeBase, updateKnowledgeEntry,testKnowledgeRoute } from "../controllers/knowledge.controller";


const knowledgeRouter = Router({mergeParams: true});

console.log("Knowledge Router initialized");
knowledgeRouter.get("/test", testKnowledgeRoute);
knowledgeRouter.get("/", getKnowledgeBase);
knowledgeRouter.post("/", addKnowledgeEntry);
knowledgeRouter.put("/:id", updateKnowledgeEntry);
knowledgeRouter.post("/learn/:id", addFromHelpRequest);

export default knowledgeRouter;