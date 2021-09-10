const {celebrate, Joi, Segments} = require('celebrate');
const {
  SPRINTER,
  SMALL_STRAIGHT,
  LARGE_STRAIGHT,
} = require('../../../constants/truckTypes');

const typeSchema = Joi.object().keys({
  type: Joi.string().valid(SPRINTER, SMALL_STRAIGHT, LARGE_STRAIGHT),
});

const manualParametersSchema = Joi.object().keys({
  name: Joi.string(),
  dimensions: Joi.object().keys({
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
    length: Joi.number().positive().required(),
  }),
  maxPayload: Joi.number().positive().required(),
});

const createOrEditTruckSchema =
  Joi.alternatives().try(typeSchema, manualParametersSchema);

module.exports = celebrate({
  [Segments.BODY]: createOrEditTruckSchema,
});
