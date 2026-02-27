import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../infra/s3";
import { env } from "../env";
import { transcribe } from "../services/transcriptionService";
import { summarize } from "../services/summarizationService";
import { saveJobOutput } from "../repositories/jobRepository";

export async function processAudioJob(
  jobId: string,
  s3Key: string
) {
  //Download audio from S3
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
    })
  );

  const body = result.Body as any;
  const chunks: Buffer[] = [];

  for await (const chunk of body) {
    chunks.push(chunk);
  }

  const audioBuffer = Buffer.concat(chunks);

  console.log(
    `Job ${jobId} downloaded file size:`,
    audioBuffer.length,
    "bytes"
  );

  //Transcribe audio
  const transcript = await transcribe(audioBuffer);
  console.log(`Job ${jobId} transcript:`, transcript);

  //Run LLM
  const llmResult = await summarize(transcript);
  console.log(`Job ${jobId} LLM result:`, llmResult);

  //Save output
  await saveJobOutput(jobId, transcript, llmResult);
}
