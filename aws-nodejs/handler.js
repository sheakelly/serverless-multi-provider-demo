'use strict';

const validateSignupDetails = require('./validateSignupDetails').validate;
const ValidationError = require('./validateSignupDetails').ValidationError;
const sendWelcomeEmail = require('./sendWelcomeEmail');
const AWS = require('aws-sdk');

const signup = (event, context, callback) => {
  console.log(`event: ${JSON.stringify(event)}`);
  console.log(`context: ${JSON.stringify(context)}`);

  const data = JSON.parse(event.body);
  console.log(`data: ${JSON.stringify(data)}`);

  validateSignupDetails(data)
    .then(publishToSNS(data))
    .then(() => {
      callback(null, createResponse(200, 'Congratulation you have signed up to the mailing list!'));
    })
    .catch(error => {
      if(error instanceof ValidationError) {
        callback(null, createResponse(400, error));
      } else {
        callback(null, createResponse(500, error));
      }
    });
};

const publishToSNS = data => {
  return new Promise((resolve, reject) => {
    const sns = new AWS.SNS();
    const params = {
      TopicArn: 'arn:aws:sns:ap-southeast-2:997909391502:mailing-list-signup-received',
      Message: JSON.stringify(data)
    };
    sns.publish(params, (err, data) => {
      if(err) {
        console.log(err);
        reject(err);
        return;
      }
      resolve();
    });
  });
};

const createResponse = (statusCode, message) => {
 return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
    }),
  };
};

const email = (event, context, callback) => {
  console.log(`event: ${JSON.stringify(event)}`);
  console.log(`context: ${JSON.stringify(context)}`);

  const data = JSON.parse(event.Records[0].Sns.Message);
  console.log(`data: ${JSON.stringify(data)}`);

  sendWelcomeEmail(data).then(() => {
    callback(null, `Email delivered to ${data.email}`);
  }).catch(error => {
    callback(error, 'Unable to send email');
  });
};

module.exports = {signup, email};
