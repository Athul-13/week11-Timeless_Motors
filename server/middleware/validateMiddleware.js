const Joi = require("joi");

const validateSignup = (req, res, next) => {
  console.log('Middleware reached');
  console.log('body',req.body);
  const schema = Joi.object({
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
      .email({ 
        minDomainSegments: 2, 
        tlds: { allow: ['com', 'net', 'org', 'edu', 'gov'] } 
      })
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'string.pattern.base': 'Email contains invalid characters',
        'string.min': 'Email is too short',
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

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(detail => ({
        message: detail.message,
        field: detail.path[0]
      }))
    });
  }

  next();
};





const validateListing = (req, res, next) => {
  const listingValidationSchema = Joi.object({
    description: Joi.string()
      .trim()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters'
      }),
  
    make: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Make is required'
      }),
  
    model: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Model is required'
      }),
  
    year: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear())
      .required()
      .messages({
        'number.base': 'Year must be a number',
        'number.integer': 'Year must be an integer',
        'number.min': 'Year must be after 1900',
        'number.max': `Year cannot be after ${new Date().getFullYear()}`
      }),
  
    fuel_type: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Fuel type is required'
      }),
  
    transmission_type: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Transmission type is required'
      }),
  
    body_type: Joi.string()
      .trim()
      .valid('Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible')
      .required()
      .messages({
        'any.only': 'Invalid body type selected',
        'string.empty': 'Body type is required'
      }),
  
    cc_capacity: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Engine capacity must be a number',
        'number.positive': 'Engine capacity must be a positive number'
      }),
  
    contact_number: Joi.string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Contact number must be 10 digits'
      }),
  
    starting_bid: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Starting bid must be a number',
        'number.positive': 'Starting bid must be a positive number'
      }),
  
    type: Joi.string()
      .trim()
      .valid('Auction', 'Fixed price')
      .required()
      .messages({
        'any.only': 'Listing type must be either Auction or Fixed price',
        'string.empty': 'Listing type is required'
      }),
  
    minimum_increment: Joi.number()
      .when('type', {
        is: 'Auction',
        then: Joi.number().positive().required(),
        otherwise: Joi.number().optional()
      })
      .messages({
        'number.positive': 'Minimum increment must be a positive number',
        'any.required': 'Minimum increment is required for auction listings'
      }),
  
    start_date: Joi.date()
      .when('type', {
        is: 'Auction',
        then: Joi.date().iso().required(),
        otherwise: Joi.date().optional()
      })
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format',
        'any.required': 'Start date is required for auction listings'
      }),
  
    end_date: Joi.date()
      .when('type', {
        is: 'Auction',
        then: Joi.date().iso().min(Joi.ref('start_date')).required(),
        otherwise: Joi.date().optional()
      })
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required for auction listings'
      }),
  
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          public_id: Joi.string().required()
        })
      )
      .min(3)
      .max(6)
      .required()
      .messages({
        'array.min': 'At least 3 images are required',
        'array.max': 'Maximum 6 images allowed'
      })
  });

  const { error } = listingValidationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(detail => ({
        message: detail.message,
        field: detail.path[0]
      }))
    });
  }

  next()
}


module.exports = {
  validateSignup, validateListing
};