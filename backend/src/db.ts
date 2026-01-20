import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { env } from "./env";

export const db = new DynamoDBClient({
    region: process.env.AWS_REGION
})