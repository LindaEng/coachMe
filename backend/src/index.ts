import express from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3";
import { env } from "./env";

const app = express();
const PORT = 3001;

app.get("/heath", (req, res) => {
    res.json({status: "ok"})
})

app.post("/upload/init", async (_req,res) => {
    const key = `audio/${Date.now()}.wav`;

    const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        ContentType: "audio/wav"
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.json({ uploadUrl, key });
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})