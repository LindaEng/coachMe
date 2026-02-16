import crypto from "crypto";
import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

import { createJob, updateJobStatus } from "../repositories/jobRepository";

import { s3 } from "../infra/s3";
import { sqs } from "../infra/sqs";
import { env } from "../env";

export async function initUpload(_req: Request, res: Response) {
  try {
    const jobId = crypto.randomUUID();
    const s3Key = `audio/${jobId}.webm`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: "audio/webm",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    await createJob(jobId, s3Key);

    res.json({ jobId, s3Key, uploadUrl });
  } catch (err) {
    console.error("initUpload error:", err);
    res.status(500).json({ error: "Failed to initialize upload" });
  }
}

export async function completeUpload(req: Request, res: Response) {
  try {
    const { jobId, s3Key } = req.body;

    if (!jobId || !s3Key) {
      return res.status(400).json({ error: "Missing jobId or s3Key" });
    }
    console.log("Queueing job:", jobId, s3Key);

    await updateJobStatus(jobId, "QUEUED");

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify({ jobId, s3Key }),
      })
    );

    res.json({ status: "queued", jobId });
  } catch (err) {
    console.error("completeUpload error:", err);
    res.status(500).json({ error: "Failed to complete upload" });
  }
}
