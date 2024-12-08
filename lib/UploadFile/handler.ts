import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient({});
const s3Client = new S3Client({});

// Move to constants
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,PUT",
};

// Add interface for DB item
interface ProductItem {
  ProductID: string;
  Name: string;
  stock: number;
  createdBy: string;
  ImageName: string;
}

export const handler = async (event: {
  body: string;
}): Promise<{ statusCode: number; body: string; headers: unknown }> => {
  const id = uuidv4();
  const { TABLE_NAME: tableName, BUCKET_NAME: bucketName } = process.env;

  if (!tableName || !bucketName) {
    throw new Error(
      "Required environment variables TABLE_NAME or BUCKET_NAME not set"
    );
  }

  try {
    // Simplify parsing - no need for double parsing if the body is already JSON
    const parsedBody = JSON.parse(event.body);
    const parsedBody2 = JSON.parse(parsedBody);
    console.log(parsedBody2);

    const { userId, fileName, name, quantity } = parsedBody2;
    // convert quantity to number
    const numericQuantity = parseInt(quantity, 10);
    console.log({
      userId,
      fileName,
      name,
      quantity: numericQuantity,
    });

    // Validate all required fields at once
    if (!userId || !fileName || !name || !quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing or invalid required fields: userId, fileName, name, quantity",
        }),
        headers: CORS_HEADERS,
      };
    }

    const item: ProductItem = {
      ProductID: id,
      Name: name,
      stock: numericQuantity,
      createdBy: userId,
      ImageName: fileName,
    };

    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(item),
      })
    );

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${fileName}`,
      }),
      { expiresIn: 60 }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl }),
      headers: CORS_HEADERS,
    };
  } catch (error) {
    console.error("Error processing request:", error);

    return {
      statusCode: error instanceof SyntaxError ? 400 : 500,
      body: JSON.stringify({
        message:
          error instanceof SyntaxError
            ? "Invalid JSON format"
            : "Internal server error",
      }),
      headers: CORS_HEADERS,
    };
  }
};
