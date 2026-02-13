import { Router } from "express";
import { getJobById } from "../services/jobService";

const router = Router();

router.get("/jobs/:jobId", getJobById);

export default router;
