import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../infra/s3";
import { env } from "../env";

export async function processAudioJob(
  jobId: string,
  s3Key: string
) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: s3Key,
  });

  const result = await s3.send(getObjectCommand);
  const body = result.Body as any;

  let size = 0;
  for await (const chunk of body) {
    size += chunk.length;
  }

  console.log(`Job ${jobId} downloaded file size:`, size, "bytes");

  return { size };
}
