import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../s3";
import { env } from "../env";

export async function processAudioJob(key: string) {
    const getObjectCommand = new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key
    });

    const result = await s3.send(getObjectCommand);
    const body = result.Body as any;

    let size = 0;
    for await (const chunk of body) {
        size += chunk.length;
    }

    console.log("Downloaded file size:", size, "bytes");

    return { size };
}
