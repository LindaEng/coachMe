import {
    ReceiveMessageCommand,
    DeleteMessageCommand,
    SendMessageCommand
} from "@aws-sdk/client-sqs";
import { sqs } from "./sqs";
import { env } from "./env";


async function replayDlq() {
    const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: env.SQS_DLQ_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5
    });

    const result = await sqs.send(receiveCommand);

    if(!result.Messages || result.Messages.length === 0) {
        console.log("No DLQ messages to replay");
        return;
    }

    for(const message of result.Messages) {
        if(!message.Body || !message.ReceiptHandle) continue;

        console.log("Replaying message: ", message.Body);

        const sendCommand = new SendMessageCommand({
            QueueUrl: env.SQS_QUEUE_URL,
            MessageBody: message.Body
        });

        await sqs.send(sendCommand);

        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: env.SQS_DLQ_URL,
            ReceiptHandle: message.ReceiptHandle
        });

        await sqs.send(deleteCommand);

        console.log("Replay successful")
    }
}




replayDlq().catch(console.error);