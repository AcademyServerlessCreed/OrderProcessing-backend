import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

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
  }
}
