import { Router } from "express";
import helpRequestsRouter from "./helpRequests.route";
import knowledgeRouter from "./knowledge.route";

const rootRouter = Router({mergeParams:true});

rootRouter.use("/knowledge", knowledgeRouter);
rootRouter.use("/helpreq", helpRequestsRouter);

export default rootRouter;