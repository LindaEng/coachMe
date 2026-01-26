import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../infra/s3";
import { env } from "../env";
import { saveJobOutput } from "../repositories/jobRepository";

async function transcribeAudio(_audio: Buffer): Promise<string> {
  // STUB — replace with AWS Transcribe later
  return "This is a placeholder transcript of the coaching conversation.";
}

async function runLLM(_transcript: string): Promise<string> {
  return `
Summary:
- Reviewed interview performance
- Identified communication gaps

Action Items:
1. Practice concise answers
2. Clarify impact in examples
3. Prepare STAR stories
`;
}

export async function processAudioJob(
  jobId: string,
  s3Key: string
) {
  // 1️⃣ Download audio from S3
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

  // 2️⃣ Transcribe audio
  const transcript = await transcribeAudio(audioBuffer);
  console.log(`Job ${jobId} transcript:`, transcript);

  // 3️⃣ Run LLM
  const llmResult = await runLLM(transcript);
  console.log(`Job ${jobId} LLM result:`, llmResult);

  // 4️⃣ Save output
  await saveJobOutput(jobId, transcript, llmResult);
}
