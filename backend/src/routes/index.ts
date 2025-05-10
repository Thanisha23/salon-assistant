import { Router } from "express";
import helpRequestsRouter from "../routes/helpRequests";

const rootRouter = Router({mergeParams: true});

rootRouter.use("/helpreq", helpRequestsRouter)

export default rootRouter