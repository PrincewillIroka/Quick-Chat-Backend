import Joi from "@hapi/joi";

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string(),
  APP_PORT: Joi.string(),
  APP_HOST: Joi.string(),
  DB_USERNAME: Joi.string(),
  DB_PASSWORD: Joi.string(),
  DB_AUTH_SOURCE: Joi.string(),
  DB_CONNECTION: Joi.string(),
})
  .unknown(true)
  .required();

const { error, value: envVars } = envVarsSchema.validate(process.env);

export default {
  host: process.env.APP_HOST,
  port: process.env.PORT,
  environment: process.env.NODE_ENV,
  db: {
    pass: envVars.DB_PASSWORD,
    user: envVars.DB_USERNAME,
    port: envVars.DB_PORT,
    host: envVars.DB_HOST,
    authSource: envVars.DB_AUTH_SOURCE,
    dbConnection: envVars.DB_CONNECTION,
  },
};
