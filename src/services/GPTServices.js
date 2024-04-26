import OpenAI from "openai";
import config from "../config";

export const openai = new OpenAI({
  apiKey: config.gpt.gpt_api_key,
});

export const createMessage = async ({ messages }) => {
  return new Promise((resolve, reject) => {
    openai.chat.completions
      .create({
        messages,
        model: config.gpt.gpt_model,
      })
      .then((response) => {
        const actualResponse = response?.choices[0]?.message?.content;
        resolve(actualResponse);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
