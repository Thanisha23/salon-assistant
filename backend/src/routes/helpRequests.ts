import { Router } from "express";
import { getHelpRequests, helpRequests, resolveHelpRequest } from "../controllers/helpRequests.controller";

const helpRequestsRouter = Router({mergeParams: true});

helpRequestsRouter.post("/", helpRequests);
helpRequestsRouter.get("/", getHelpRequests);
helpRequestsRouter.patch("/:id", resolveHelpRequest);


export default helpRequestsRouter;