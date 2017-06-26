'use strict';

const emailValidator = require('email-validator');
const AWS = require('aws-sdk');

const signup = (event, context, callback) => {
  console.log(`event: ${event}`);
  console.log(`context: ${context}`);

  const data = JSON.parse(event.body);
  console.log(`data: ${data}`);

  const validationError = validateSignup(data);
  if(validationError) {
    callback(null, createResponse(400, validationError));
    return;
  }

  const sns = new AWS.SNS();
  const publishParams = {
    TopicArn: 'arn:aws:sns:ap-southeast-2:997909391502:mailing-list-signup-received'
    Message: data
  };
  sns.publish(params, (err, data) => {
    if(err) {
      callback(null, createResponse(500, 'Unable to publish to message');
      return;
    }
    callback(null, createResponse(200, 'Congratulation you have signed up to the newsletter!');
  });
};

const validateSignup = data => {
  if(!data.firstName) {
    return 'First name is invalid';
  }
  if(!data.lastName) {
    return 'Last name is invalid';
  }
  if(emailValidator.validate(data.email)) {
    return 'Email is invalid';
  }
  return null;
};

const sendWelcomeEmail = (event, context, callback) => {
  console.log(`event: ${event}`);
  console.log(`context: ${context}`);

  //connect to mandrill
  //send welcome email
};

const createResponse = (statusCode, message) => {
 return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message,
    }),
  };
};

module.exports = {signup, sendWelcomeEmail};
