import { Router } from "express";
import { getJobById } from "../controller/jobController";

const router = Router();

router.get("/jobs/:jobId", getJobById);

export default router;
