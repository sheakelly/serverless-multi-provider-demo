const mailHelper = require('sendgrid').mail;

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

module.exports = sendWelcomeEmail;
