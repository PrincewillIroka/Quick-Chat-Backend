import cloudinary from "cloudinary";
import OpenAI from "openai";
import config from "../config";

cloudinary.config({
  cloud_name: config.upload.cloud_name,
  api_key: config.upload.api_key,
  api_secret: config.upload.api_secret,
});

export async function uploader(file, folder_id, public_id) {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        folder: folder_id,
        resource_type: "auto",
        ...(public_id && { public_id }),
      },
      function (error, result) {
        if (error) {
          reject(error);
          throw error;
        } else {
          resolve(result);
        }
      }
    );
  });
}

export const openai = new OpenAI({
  apiKey: config.gpt.gpt_api_key,
});
