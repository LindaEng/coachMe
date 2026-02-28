import crypto from "crypto";
import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createJob } from "../repositories/jobRepository";

import { s3 } from "../infra/s3";
import { sqs } from "../infra/sqs";
import { env } from "../env";

export async function initUpload(req: Request, res: Response) {
  try {
    const jobId = crypto.randomUUID();
    const s3Key = `audio/${jobId}.webm`;
    const { email } = req.body;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: "audio/webm",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    await createJob(jobId, s3Key, email);

    res.json({ jobId, s3Key, uploadUrl });
  } catch (err) {
    console.error("initUpload error:", err);
    res.status(500).json({ error: "Failed to initialize upload" });
  }
}


