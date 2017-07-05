'use strict';

const azure = require('azure-storage');
const mailHelper = require('sendgrid').mail;
const emailValidator = require('email-validator');

const signup = (context, req) => {
  context.log(`context: ${JSON.stringify(context)}`);
  context.log(`req: ${JSON.stringify(req)}`);

  const data = req.body;
  context.log(`data: ${JSON.stringify(data)}`);

  return validateSignupDetails(data)
    .then(() => {
      return queueMessage(data, context);
    })
    .then(result => {
      context.log(result);
      context.res = {
        status: 200,
        body: 'You have signed up to the mailing list!',
      };
    }).catch(error => {
      context.log(error);
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
    });
};

class ValidationError extends Error {}

const validateSignupDetails = data => {
    if(!data.firstName) {
      return Promise.reject(new ValidationError('First name is invalid'));
    }
    if(!data.lastName) {
      return Promise.reject(new ValidationError('Last name is invalid'));
    }
    if(!emailValidator.validate(data.email)) {
      return Promise.reject(new ValidationError('Email is invalid'));
    }
    return Promise.resolve(data);
};

const queueMessage = (data, context) => {
  return new Promise((resolve, reject) => {
    context.log('queuing...');
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage).withFilter(retryOperations);
    queueSvc.messageEncoder = new azure.QueueMessageEncoder.TextBase64QueueMessageEncoder();
    var queueName = 'mailing-list-signup-received';
    queueSvc.createQueueIfNotExists(queueName, function(error, result, response){
       if(error) {
         reject(error);
       } else {
       context.log(JSON.stringify(data));
       queueSvc.createMessage(queueName, JSON.stringify(data), error => {
          context.log('queuing...createMessage');
          if(error) {
            context.log('queuing...error');
            reject(error);
          } else {
            context.log('queuing...success');
            resolve(data);
          }
        });
      }
    });
  });
};

const email = (context, item) => {
  context.log(`context: ${JSON.stringify(context)}`);
  context.log(`item: ${JSON.stringify(item)}`);

  sendWelcomeEmail(item).then(() => {
    context.log('Eamil sent');
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
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = {signup, email};
