import fs from "fs";
import path from "path";
import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";
import File from "../models/File";
import mongoose from "mongoose";
const ObjectIdType = mongoose.Types.ObjectId;

const createChat = async (req, res) => {
  try {
    const { creator_id, passcode, chat_name } = req.body;
    const chat_url = generateChatUrl(); //Todo: Ensure chat_url is unique from others in the db Chat model

    const participants = [creator_id];

    let newChat = await Chat.create({
      creator_id,
      chat_url,
      passcode,
      participants,
      chat_name,
    });
    newChat = await newChat.populate([
      {
        path: "participants",
        select: ["name", "photo"],
      },
    ]);
    res.send({ newChat });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const uploadFile = async (req, res) => {
  try {
    const { chat_id, sender_id, messageId } = req.body;
    const files = req.files;

    const folder_path = `static/chat_images/${chat_id}`;

    const staticFolder = path.join(process.cwd(), folder_path);
    if (!fs.existsSync(staticFolder)) {
      fs.mkdirSync(staticFolder, { recursive: true });
    }

    (async () => {
      for (const [key, value] of Object.entries(files)) {
        await handleFileUpload(key, value);
      }

      async function handleFileUpload(key, value) {
        const { data, ...rest } = value;
        const { name: file_name, mimetype, size } = rest;
        const file_url = `${folder_path}/${file_name}`;

        // Todo: If file exists, append a number to filename to avoid duplicates
        fs.writeFile(file_url, data, async (err, rs) => {
          if (err) throw err;

          //Create new File in db
          const newFile = await File.create({
            chat_id,
            sender: sender_id,
            file_details: { file_name, mimetype, size, file_url },
          });

          //Add file _id to attachments array in messages
          let chat = await Chat.findOneAndUpdate(
            {
              _id: chat_id,
              $or: [
                { creator_id: sender_id },
                { participants: { $in: [sender_id] } },
              ],
              "messages._id": messageId,
            },
            { $push: { "messages.$.attachments": newFile._id } },
            { new: true }
          );

          req.io.sockets.emit("uploadedFileSuccess", {
            chat_id,
            sender_id,
            messageId,
            attachmentKey: key,
            file_url,
          });
        });

        // Todo: Switch file upload to use readable & writeable stream
        // const readableStream = fs.createReadStream().from(data);
        // const writeableStream = fs.createWriteStream(url);

        // let writtenData = 0;

        // readableStream.on("data", (data) => {
        //   writeableStream.write(data, () => {
        //     writtenData += data.length;
        //     console.log("Has read", writtenData);
        //   });
        // });
      }
    })();

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat, uploadFile };
