// https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/ses/src/libs/sesClient.js

const { SESClient } = require("@aws-sdk/client-ses");
// Set the AWS Region.
const REGION = "ap-south-1";
// Create SES service object.
const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_IAM_SES_Access_key,
    secretAccessKey: process.env.AWS_IAM_SES_Secret_access_key,
  },
});

module.exports = { sesClient };
// snippet-end:[ses.JavaScript.createclientv3]