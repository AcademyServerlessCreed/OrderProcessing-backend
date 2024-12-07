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

  }
}
