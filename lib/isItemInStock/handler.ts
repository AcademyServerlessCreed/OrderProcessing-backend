import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

interface Item {
  ProductID: string;
  stock: number;
}

export const handler = async ({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}): Promise<{ statusCode: number; body: string; headers: unknown }> => {
  const tableName = process.env.TABLE_NAME;
  const { Item: rawItem } = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: marshall({ ProductID: itemId }),
    })
  );

  if (!rawItem) {
    throw new Error("Item not found");
  }

  const item = unmarshall(rawItem) as Item;
  if (item.stock < quantity) {
    return {
      statusCode: 400,
      body: JSON.stringify({ inStock: false }),
      headers: { "Content-Type": "application/json" },
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ inStock: true }),
    headers: { "Content-Type": "application/json" },
  };
};
