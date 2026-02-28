import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "../infra/sqs";
import { env } from "../env";
import { processAudioJob } from "../services/audioProcessingService";
import { updateJobStatus } from "../repositories/jobRepository";

async function pollQueue() {
  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  });

  const result = await sqs.send(receiveCommand);
  if (!result.Messages || result.Messages.length === 0) return;

  for (const message of result.Messages) {
    if (!message.Body) continue;

    const body = JSON.parse(message.Body);
    const record = body.Records?.[0];

  if (!record?.s3?.object?.key) {
    console.error("Unexpected SQS format:", body);

    // delete bad message so it doesn’t keep retrying
    if (message.ReceiptHandle) {
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: env.SQS_QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
    }

    continue; // VERY IMPORTANT
  }

    const s3Key = record.s3.object.key;
    const fileName = s3Key.split("/")[1];
    const jobId = fileName.split(".")[0];

    try {
      await updateJobStatus(jobId, "PROCESSING");
      await processAudioJob(jobId, s3Key);
      await updateJobStatus(jobId, "SUCCEEDED");
      if (message.ReceiptHandle) {
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: env.SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          })
        );
      }
    } catch (err) {
      console.error("Job failed: ", err);
      await updateJobStatus(jobId, "FAILED");
    }
  }
}

async function start() {
  console.log("Worker started");
  while (true) {
    try {
      await pollQueue();
    } catch (err) {
      console.error("Worker error:", err);
    }
  }
}

start();
