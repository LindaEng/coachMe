import express from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { db } from "./db";
import { s3 } from "./s3";
import { sqs } from "./sqs";
import { env } from "./env";

const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/heath", (req, res) => {
    res.json({status: "ok"})
})

app.post("/upload/init", async (_req,res) => {
    try {
        const key = `audio/${Date.now()}.wav`;

        const command = new PutObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
            ContentType: "audio/wav"
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

        res.json({ uploadUrl, key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to init upload" });
    }
})

app.post("/upload/complete", async (req, res) => {
    try {
        const { key } = req.body;
        if(!key) {
            return res.status(400).json({ error: "Missing Key "});
        }

        const message = new SendMessageCommand({
            QueueUrl: env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify({ key })
        })

        await db.send(
            new PutItemCommand({
                TableName: env.JOBS_TABLE_NAME,
                Item: {
                    jobId: { S: key },
                    status: { S: "PENDING" },
                    createdAt: { N: Date.now().toString() },
                    updatedAt: { N: Date.now().toString() }
                }
            })
        )

        await sqs.send(message);
        res.json({ status: "queued" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to enqueue the job "});
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})