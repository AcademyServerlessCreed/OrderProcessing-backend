import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* Creating our DynamoDB table
     * - Users Table
     * - Product Table
     * - Orders Table
     */

    const UsersTable = new cdk.aws_dynamodb.TableV2(this, "UsersTable", {
      partitionKey: {
        name: "UserID",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      tableName: "Users",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const ProductTable = new cdk.aws_dynamodb.TableV2(this, "ProductTable", {
      partitionKey: {
        name: "ProductID",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      tableName: "Products",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const OrderTable = new cdk.aws_dynamodb.TableV2(this, "OrderTable", {
      partitionKey: {
        name: "OrderID",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      tableName: "Orders",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /* Creating our Lambda function for PostConfirmation
     * - This function is triggered after a user is confirmed
     * - It creates a user in our (Users) table
     *  - Grants write access to the Users table
     */
    const postConfirmation = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "PostConfirmationFunction",
      {
        entry: path.join(__dirname, "PostConfirmation", "handler.ts"),
        handler: "handler",
        environment: {
          TABLE_NAME: UsersTable.tableName,
        },
      }
    );
    UsersTable.grantWriteData(postConfirmation);

    /* Creating our S3 bucket
     * - This is where we will store our images
     * - Grants write access to the bucket
     */

    const bucket = new cdk.aws_s3.Bucket(this, "ImageBucket", {
      cors: [
        {
          allowedMethods: [
            cdk.aws_s3.HttpMethods.GET,
            cdk.aws_s3.HttpMethods.PUT,
            cdk.aws_s3.HttpMethods.POST,
            cdk.aws_s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    /* Creating our Lambda function for UploadFile
     * - This function is triggered when a file is uploaded to our S3 bucket
     * - It creates a product in our (Products) table
     *  - Grants write access to the Products table
     */

    const uploadFileLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "UploadFileFunction",
      {
        entry: path.join(__dirname, "UploadFile", "handler.ts"),
        handler: "handler",
        environment: {
          TABLE_NAME: ProductTable.tableName,
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    ProductTable.grantReadWriteData(uploadFileLambda);
    bucket.grantPut(uploadFileLambda);
    bucket.grantPutAcl(uploadFileLambda);
  }
}
