import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async ({
  item: { itemId, quantity },
}: {
  item: { itemId: string; quantity: string };
}): Promise<void> => {
  const tableName = process.env.TABLE_NAME || "";
  const numericQuantity = parseInt(quantity, 10);

  try {
    console.log(
      `Updating stock for item ${itemId}. Reducing by ${numericQuantity}`
    );

    const result = await client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: {
          ProductID: { S: itemId },
        },
        UpdateExpression: "SET stock = stock - :quantity",
        ExpressionAttributeValues: {
          ":quantity": { N: numericQuantity.toString() },
        },
        ReturnValues: "ALL_NEW",
      })
    );

    console.log("Stock update successful:", {
      itemId,
      newStock: result.Attributes?.stock?.N || "unknown",
    });
  } catch (error) {
    console.error("Failed to update stock:", {
      itemId,
      quantity: numericQuantity,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};
