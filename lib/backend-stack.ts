import * as cdk from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
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

    /* Creating our Cognito User Pool
     * - This is where we will manage our users
     */

    const userPool = new cdk.aws_cognito.UserPool(this, "UserPool", {
      userPoolName: "USER-POOL",
      selfSignUpEnabled: true,

      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        name: new cdk.aws_cognito.StringAttribute({
          minLen: 3,
          maxLen: 20,
        }),
      },
      lambdaTriggers: {
        postConfirmation: postConfirmation,
      },
    });

    /* Creating our Cognito User Pool Client
     * - This is where we will manage our users
     */
    const client = new cdk.aws_cognito.UserPoolClient(
      this,
      "USER-POOL-CLIENT",
      {
        userPool: userPool,
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      }
    );

    const adminGroup = new cdk.aws_cognito.CfnUserPoolGroup(
      this,
      "AdminGroup",
      {
        userPoolId: userPool.userPoolId,
        groupName: "admin",
        description: "Admin user group",
      }
    );

    /* Creating our API Authorizer and API
     * - This is where we will manage our API
     * - Create Route For UploadFile
     */

    const authorizer = new HttpUserPoolAuthorizer(
      "UserPoolAuthorizer",
      userPool,
      {
        userPoolClients: [client],
        identitySource: ["$request.header.Authorization"],
      }
    );

    const API = new cdk.aws_apigatewayv2.HttpApi(this, "TodoHttpAPI", {
      apiName: "SFAPI",
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          cdk.aws_apigatewayv2.CorsHttpMethod.GET,
          cdk.aws_apigatewayv2.CorsHttpMethod.POST,
          cdk.aws_apigatewayv2.CorsHttpMethod.PUT,
          cdk.aws_apigatewayv2.CorsHttpMethod.DELETE,
          cdk.aws_apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(10),
      },
      defaultAuthorizer: new HttpUserPoolAuthorizer(
        "UserpoolAuthorizer",
        userPool
      ),
    });

    /* Creating our route for UploadFile
     * - This is where we will manage our UploadFile route
     *  - Grants write access to the UploadFile Lambda function
     */
    const uploadImageRoute = new cdk.aws_apigatewayv2.HttpRoute(
      this,
      "UploadFileRoute",
      {
        httpApi: API,
        routeKey: cdk.aws_apigatewayv2.HttpRouteKey.with(
          "/uploadFile",
          cdk.aws_apigatewayv2.HttpMethod.POST
        ),
        integration: new HttpLambdaIntegration(
          "UploadImageIntegration",
          uploadFileLambda
        ),
        authorizer: authorizer,
      }
    );
  }
}
