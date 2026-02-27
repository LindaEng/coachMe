import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../infra/s3";
import { env } from "../env";
import { transcribe } from "../services/transcriptionService";
import { summarize } from "../services/summarizationService";
import { getJob, saveJobOutput } from "../repositories/jobRepository";
import { sendEmail } from "./emailService";

export async function processAudioJob(
    jobId: string,
    s3Key: string
) {
    //Fetch job 
    const job = await getJob(jobId);

    if(!job?.email) {
        console.warn(`No email found for job ${jobId}`);
        return;
    }

    // download audio
    const result = await s3.send(
        new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: s3Key
        })
    );

    const body = result.Body as any;
    const chunks: Buffer[] = [];

    for await (const chunk of body) {
        chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);

    // transcribe
    const transcript = await transcribe(audioBuffer);

    // summarize
    const llmResult = await summarize(transcript);

    // persist output
    await saveJobOutput(jobId, transcript, llmResult);

    // send email
    try {
        await sendEmail(
            job.email,
            "Your Coaching Summary",
            llmResult
        )
    } catch (error) {
        console.error(`Email failed for job ${jobId}:`, error);
    }
}
