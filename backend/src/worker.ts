import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";
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

        //check job state
        const job = await db.send(
            new GetItemCommand({
                TableName: env.JOBS_TABLE_NAME,
                Key: { jobId: { S: key }}
            })
        )

        if (!job.Item || job.Item.status.S !== "PENDING") {
            console.log("Skipping job, already processed:", key);
            return;
        }
        
        await db.send(
            new UpdateItemCommand({
                TableName: env.JOBS_TABLE_NAME,
                Key: { jobId: { S: key }},
                UpdateExpression: "SET #s = :s, updatedAt = :u",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: {
                    ":s": { S: "PROCESSING" },
                    ":u": { N: Date.now().toString() }
                }
            })
        )

        try {
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

            await db.send(
                new UpdateItemCommand({
                    TableName: env.JOBS_TABLE_NAME,
                    Key: { jobId: { S: key }},
                    UpdateExpression: "SET #s = :s, updatedAt = :u",
                    ExpressionAttributeNames: { "#s": "status" },
                    ExpressionAttributeValues: {
                        ":s": { S: "SUCCEEDED" },
                        ":u": { N: Date.now().toString() }
                    }
                })
            )

            if (message.ReceiptHandle) {
                const deleteCommand = new DeleteMessageCommand({
                    QueueUrl: env.SQS_QUEUE_URL,
                    ReceiptHandle: message.ReceiptHandle
                });

                await sqs.send(deleteCommand);
                console.log("Message Deleted");
            }
        } catch (err) {
            await db.send(
                new UpdateItemCommand({
                TableName: env.JOBS_TABLE_NAME,
                Key: { jobId: { S: key } },
                UpdateExpression: "SET #s = :s, error = :e, updatedAt = :u",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: {
                    ":s": { S: "FAILED" },
                    ":e": { S: String(err) },
                    ":u": { N: Date.now().toString() }
                }
                })
            );
            throw err; // let SQS retry / DLQ
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

