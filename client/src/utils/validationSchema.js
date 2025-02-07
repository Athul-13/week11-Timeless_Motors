import Joi from 'joi';
import { useState } from 'react';

export const signupSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name must contain only letters',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),

  last_name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[A-Za-z\s-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name must contain only letters',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),

  phone_no: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number',
      'any.required': 'Phone number is required'
    }),

  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov'] } })
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must include 1 uppercase, 1 number, and 1 symbol',
      'any.required': 'Password is required'
    }),

  termsAccepted: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the Terms and Conditions'
    })
});

export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const fieldSchema = schema.extract(name);
    const { error } = fieldSchema.validate(value);
    return error ? error.details[0].message : '';
  };

  const validateForm = (data) => {
    const { error } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      const errorDetails = {};
      error.details.forEach(err => {
        errorDetails[err.path[0]] = err.message;
      });
      setErrors(errorDetails);
      return false;
    }
    
    setErrors({});
    return true;
  };

  return { errors, validateField, validateForm, setErrors };
};
