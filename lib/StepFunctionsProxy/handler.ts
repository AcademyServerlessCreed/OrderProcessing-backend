// StepFunctionsProxy/handler.ts

import { StartExecutionCommand, SFNClient } from "@aws-sdk/client-sfn";

const stepFunctions = new SFNClient({});

export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2));
  const orderString = JSON.parse(event.body);
  console.log({ orderString });
  const order = JSON.parse(orderString);
  console.log({ order });

  const input = {
    order: order,
  };

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    input: JSON.stringify(input),
  };

  try {
    await stepFunctions.send(new StartExecutionCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Execution started successfully" }),
    };
  } catch (error) {
    console.error("Error starting execution:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error starting execution" }),
    };
  }
};
