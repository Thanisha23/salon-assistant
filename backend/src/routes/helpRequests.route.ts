import { Router } from "express";
import { getHelpRequests, helpRequests, resolveHelpRequest } from "../controllers/helpRequests.controller";

const helpRequestsRouter = Router({mergeParams: true});

helpRequestsRouter.get("/", getHelpRequests);
helpRequestsRouter.post("/", helpRequests);
helpRequestsRouter.patch("/:id", resolveHelpRequest);


export default helpRequestsRouter;