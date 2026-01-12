import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import { sqs } from "./sqs";
import { env } from "./env";

async function pollQueue() {
    const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10
    });

    const result = await sqs.send(receiveCommand);

    if (!result.Messages || result.Messages.length === 0) {
        console.log("No Messages");
        return;
    }

    for (const message of result.Messages) {
        if(!message.Body) continue;

        const { key } = JSON.parse(message.Body);
        console.log("Processing file:", key);

        const getObjectCommand = new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key
        })

        const result = await s3.send(getObjectCommand);
        const body = result.Body as any;

        let size = 0;
        for await (const chunk of body) {
            size += chunk.length;
        }

        console.log("Downloaded file size: ", size, "bytes");

        if (message.ReceiptHandle) {
            const deleteCommand = new DeleteMessageCommand({
                QueueUrl: env.SQS_QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
            });

            await sqs.send(deleteCommand);
            console.log("Message Deleted");
        }
    }
};

async function start() {
    console.log("Worker started");
    while(true) {
        await pollQueue();
    }
}

start();

