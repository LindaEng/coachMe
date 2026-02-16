import OpenAI, { toFile } from "openai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { openai } from "../infra/openai";
import { s3 } from "../infra/s3";
import { env } from "../env";
import { saveJobOutput } from "../repositories/jobRepository";

async function transcribeAudio(audio: Buffer): Promise<string> {
  const file = await toFile(audio, "audio.webm", {
    type: "audio/webm"
  })

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1"
  })

  return response.text;
}

async function runLLM(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
            You are a professional executive coach.
            Summarize the following coaching conversation.
            Return:

            1. A short summary
            2. 3–5 key insights
            3. Clear action items
        `.trim(),
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    temperature: 0.2,
    max_tokens: 100
  });

  return response.choices[0].message.content || "";
}

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
  const transcript = await transcribeAudio(audioBuffer);
  console.log(`Job ${jobId} transcript:`, transcript);

  //Run LLM
  const llmResult = await runLLM(transcript);
  console.log(`Job ${jobId} LLM result:`, llmResult);

  //Save output
  await saveJobOutput(jobId, transcript, llmResult);
}
