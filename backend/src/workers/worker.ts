import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "../infra/sqs";
import { env } from "../env";
import { processAudioJob } from "../jobs/processAudioJob";
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

    const { jobId, s3Key } = JSON.parse(message.Body);

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
      await updateJobStatus(jobId, "FAILED");
      throw err; // let SQS retry / DLQ
    }
  }
}

async function start() {
  console.log("Worker started");
  while (true) {
    await pollQueue();
  }
}

start();
