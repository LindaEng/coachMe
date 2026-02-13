import { Request, Response } from "express";
import { getJob } from "../repositories/jobRepository";

export async function getJobById(req: Request, res: Response) {
  const { jobId } = req.params as { jobId: string };

  const job = await getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
}
