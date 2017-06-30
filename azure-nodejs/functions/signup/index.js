'use strict';

var azure = require('azure-storage');

/* eslint-disable no-param-reassign */

module.exports.signup = (context, req) => {
  var retryOperations = new azure.ExponentialRetryPolicyFilter();
  var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage).withFilter(retryOperations);
  var queueName = 'mailing-list-signup-received';
  queueSvc.createQueueIfNotExists(queueName, function(error, result, response){
    if(!error) {
      context.log("queue created or exists");
      queueSvc.createMessage(queueName, req.body, (error, result, response) => {
        if(!error) {
          context.log('message queued ok');
          context.res = {
            body: 'You have signed up to the mailing list!',
          };
        } else {
          context.log(error);
          context.res = {
            status: 500,
            body: 'Something went horribly wrong!',
          };
        }
        context.done();
      });
    }
  });
};

module.exports.sendWelcomeEmail = (context, item) => {
  context.log(`item: ${JSON.stringify(item)}`);
};
