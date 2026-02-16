import { UpdateItemCommand, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { db } from "../infra/db";
import { env } from "../env";

export async function getJob(jobId: string) {
  const result = await db.send(
    new GetItemCommand({
      TableName: env.JOBS_TABLE_NAME,
      Key: { jobId: { S: jobId } },
    })
  );

  return result.Item;
}

export async function createJob(jobId: string, s3Key: string) {
  await db.send(new PutItemCommand({
    TableName: env.JOBS_TABLE_NAME,
    Item: {
      jobId: { S: jobId },
      s3Key: { S: s3Key },
      status: { S: "UPLOADING" },
      createdAt: { N: Date.now().toString() },
      updatedAt: { N: Date.now().toString() },
    }
  }));
}

export async function updateJobStatus(jobId: string, status: string) {
  await db.send(new UpdateItemCommand({
    TableName: env.JOBS_TABLE_NAME,
    Key: { jobId: { S: jobId } },
    UpdateExpression: "SET #s = :s, updatedAt = :u",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: {
      ":s": { S: status },
      ":u": { N: Date.now().toString() },
    },
  }));
}

export async function saveJobOutput(
  jobId: string,
  transcript: string,
  result: string
) {
  await db.send(
    new UpdateItemCommand({
      TableName: env.JOBS_TABLE_NAME,
      Key: { jobId: { S: jobId } },
      UpdateExpression: `
        SET transcript = :t,
            #r = :r,
            updatedAt = :u
      `,
      ExpressionAttributeNames: {
        "#r": "result"
      },
      ExpressionAttributeValues: {
        ":t": { S: transcript },
        ":r": { S: result },
        ":u": { N: Date.now().toString() },
      },
    })
  );
}
