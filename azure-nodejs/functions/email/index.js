'use strict';

const azure = require('azure-storage');
const mailHelper = require('sendgrid').mail;
const emailValidator = require('email-validator');

const signup = (context, req) => {
  console.log(`context: ${JSON.stringify(context)}`);
  console.log(`req: ${JSON.stringify(req)}`);

  const data = req.body;
  console.log(`data: ${JSON.stringify(data)}`);

  validateSignupDetails(data)
    .then(queueMessage(data))
    .then(() => {
      context.res = {
        status: 200,
        body: 'You have signed up to the mailing list!',
      };
      context.done();
    }).catch(error => {
      if(error instanceof ValidationError) {
        context.res = {
          status: 400,
          body: error,
        };
      } else {
        context.res = {
          status: 500,
          body: 'Something went horribly wrong!',
        };
      }
      context.done();
    });
};

class ValidationError extends Error {}

const validateSignupDetails = data => {
    if(!data.firstName) {
      return Promise.reject(new ValidationError('First name is invalid'));
    }
    if(!data.lastName) {
      Promise.reject(new ValidationError('Last name is invalid'));
    }
    if(!emailValidator.validate(data.email)) {
      Promise.reject(new ValidationError('Email is invalid'));
    }
    return Promise.resolve();
};

const queueMessage = data => {
  return new Promise((resolve, reject) => {
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage).withFilter(retryOperations);
    queueSvc.messageEncoder = new azure.QueueMessageEncoder.TextBase64QueueMessageEncoder();
    var queueName = 'mailing-list-signup-received';
    queueSvc.createQueueIfNotExists(queueName, function(error, result, response){
      if(error) {
        reject(error);
      } else {
        context.log("queue created or exists");
        queueSvc.createMessage(queueName, req.body, (error, result, response) => {
          if(error) {
            reject(error);
          } else {
            context.log("message queued");
            resovle();
          }
        });
      }
    });
  });
};

const email = (context, item) => {
  console.log(`context: ${JSON.stringify(context)}`);
  context.log(`item: ${JSON.stringify(item)}`);

  sendWelcomeEmail(item).then(() => {
    context.done();
  }).catch(error => {
    context.log(error);
    context.done();
  });
};

const sendWelcomeEmail = data => {
  return new Promise((resolve, reject) => {
    const fromEmail = new mailHelper.Email('newsletter@example.com');
    const toEmail = new mailHelper.Email(data.email);
    const subject = 'Welcome to the awesome mailing list';
    const body = `Hello ${data.firstName} ${data.lastName}, Your signup was successful!`;
    const content = new mailHelper.Content('text/plain', body);
    const mail = new mailHelper.Mail(fromEmail, subject, toEmail, content);
    const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    });

    sg.API(request, function (error, response) {
      if (error) {
        console.log('Error response received');
        reject(error);
      } else {
        console.log(`Email sent to ${data.email}`);
        resolve();
      }
    });
  });
};

module.exports = {signup, email};
