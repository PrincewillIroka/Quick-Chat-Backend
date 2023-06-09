import Joi from "@hapi/joi";

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string(),
  APP_PORT: Joi.string(),
  APP_HOST: Joi.string(),
  DB_USERNAME: Joi.string(),
  DB_PASSWORD: Joi.string(),
  DB_AUTH_SOURCE: Joi.string(),
  DB_CONNECTION: Joi.string(),
  FRONTEND_APP_URL: Joi.string(),
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
  host: process.env.APP_HOST,
  port: process.env.APP_PORT,
  environment: process.env.NODE_ENV,
  db: {
    pass: envVars.DB_PASSWORD,
    user: envVars.DB_USERNAME,
    port: envVars.DB_PORT,
    host: envVars.DB_HOST,
    authSource: envVars.DB_AUTH_SOURCE,
    dbConnection: envVars.DB_CONNECTION,
  },
  frontendAppUrl: process.env.FRONTEND_APP_URL,
  upload: {
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
  },
  serverAddress: process.env.SERVER_ADDRESS,
  redisUrl: process.env.REDIS_URL,
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM,
    initVector: process.env.ENCRYPTION_INIT_VECTOR,
    securityKey: process.env.ENCRYPTION_SECURITY_KEY,
  },
};
