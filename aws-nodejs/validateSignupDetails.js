const emailValidator = require('email-validator');

class ValidationError extends Error {}

const validate = data => {
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

module.exports = {ValidationError, validate};
