import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";

// Singleton client instance
const client = new DynamoDBClient();

export const handler = async (
  event: PostConfirmationConfirmSignUpTriggerEvent
): Promise<PostConfirmationConfirmSignUpTriggerEvent> => {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("TABLE_NAME environment variable is not set");
  }

  const { sub, email, name } = event.request.userAttributes;
  if (!sub || !email) {
    throw new Error("Required user attributes are missing");
  }

  const params = {
    TableName: tableName,
    Item: marshall({
      UserID: sub,
      Email: email,
      Name: name ?? "",
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      __typename: "User",
    }),
  };

  try {
    await client.send(new PutItemCommand(params));
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error; // Rethrow to trigger Lambda retry
  }

  return event;
};
