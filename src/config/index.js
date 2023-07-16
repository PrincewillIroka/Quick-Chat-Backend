import Joi from "@hapi/joi";

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string(),
  APP_PORT: Joi.string(),
  APP_HOST: Joi.string(),
  DB_USERNAME: Joi.string(),
  DB_PASSWORD: Joi.string(),
  DB_PORT: Joi.string(),
  DB_HOST: Joi.string(),
  DB_AUTH_SOURCE: Joi.string(),
  DB_CONNECTION: Joi.string(),
  FRONTEND_APP_URL: Joi.string(),
  CLOUDINARY_CLOUD_NAME: Joi.string(),
  CLOUDINARY_API_KEY: Joi.string(),
  CLOUDINARY_API_SECRET: Joi.string(),
  SERVER_ADDRESS: Joi.string(),
  REDIS_URL: Joi.string(),
  ENCRYPTION_ALGORITHM: Joi.string(),
  ENCRYPTION_INIT_VECTOR: Joi.string(),
  ENCRYPTION_SECURITY_KEY: Joi.string(),
})
  .unknown(true)
  .required();

const { value: envVars } = envVarsSchema.validate(process.env);

export default {
  host: envVars.APP_HOST,
  port: envVars.APP_PORT,
  environment: envVars.NODE_ENV,
  db: {
    pass: envVars.DB_PASSWORD,
    user: envVars.DB_USERNAME,
    port: envVars.DB_PORT,
    host: envVars.DB_HOST,
    authSource: envVars.DB_AUTH_SOURCE,
    dbConnection: envVars.DB_CONNECTION,
  },
  frontendAppUrl: envVars.FRONTEND_APP_URL,
  upload: {
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
  },
  serverAddress: envVars.SERVER_ADDRESS,
  redisUrl: envVars.REDIS_URL,
  encryption: {
    algorithm: envVars.ENCRYPTION_ALGORITHM,
    initVector: envVars.ENCRYPTION_INIT_VECTOR,
    securityKey: envVars.ENCRYPTION_SECURITY_KEY,
  },
};
