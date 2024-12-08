import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});

export const handler = async ({
  order,
}: {
  order: { itemId: string; quantity: number }[];
}): Promise<void> => {
  const tableName = process.env.TABLE_NAME;
  const id = uuidv4();

  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: {
        OrderID: { S: id },
        order: {
          L: order.map(({ itemId, quantity }) => ({
            M: { itemId: { S: itemId }, quantity: { N: quantity.toString() } },
          })),
        },
      },
    })
  );
};
