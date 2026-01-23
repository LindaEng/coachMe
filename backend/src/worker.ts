import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { processAudioJob } from "./jobs/processAudioJob";
import { db } from "./db";
import { sqs } from "./sqs";
import { env } from "./env";

async function pollQueue() {
    //checks the queue
    const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10
    });

    const result = await sqs.send(receiveCommand);
    //if no messages
    if (!result.Messages || result.Messages.length === 0) {
        console.log("No Messages");
        return;
    }
    //messages
    for (const message of result.Messages) {
        if(!message.Body) continue;
        //extract key
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
        //if pending - update to processing
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
            await processAudioJob(key);
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

