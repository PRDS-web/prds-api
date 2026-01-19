import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "./sqsClient.js";

const QUEUE_URL = process.env.SQS_QUEUE_URL;

export async function publishJobEvent(payload) {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  });

  await sqsClient.send(command);
}
