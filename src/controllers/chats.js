import fs from "fs";
import path from "path";
import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";
import File from "../models/File";
import { uploader } from "../services";
import config from "../config";

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
    const { chat_id, sender_id, message_id } = req.body;
    const files = req.files || [];

    const totalFileSize = Object.values(files).reduce(
      (acc, cur) => acc + cur.size,
      0
    );

    if (totalFileSize > 5000000) {
      return res.send({
        success: false,
        message: `Maximum size for files is 5MB.`,
      });
    }

    (async () => {
      for (const [key, value] of Object.entries(files)) {
        await handleFileUpload(key, value);
      }

      async function handleFileUpload(key, value) {
        const { data, ...rest } = value;
        const { name, mimetype, size } = rest;

        //Create new File in db
        const newFile = await File.create({
          sender: sender_id,
          chat_id,
          message_id,
          attachment: {
            name,
            mimetype,
            size,
            key,
            isUploading: "In Progress",
          },
        });

        // Todo: If file exists, append a number to filename to avoid duplicates

        let fileUploadResult, file_url;

        if (config.environment !== "production") {
          // Local file upload
          const folder_path = `static/chat_images/${chat_id}`;

          const staticFolder = path.join(process.cwd(), folder_path);
          if (!fs.existsSync(staticFolder)) {
            fs.mkdirSync(staticFolder, { recursive: true });
          }

          const file_path = `${folder_path}/${name}`;
          file_url = `${config.serverAddress}/api/static/${chat_id}/${name}`;

          fileUploadResult = await fs.writeFile(file_path, data, (err, rs) => {
            if (err) throw err;
            return rs;
          });
        } else {
          fileUploadResult = await uploader(value.tempFilePath, chat_id).then(
            async (result) => result
          );
          file_url = fileUploadResult.url;
        }

        const newFileId = newFile._id;

        const updatedFile = await File.findOneAndUpdate(
          { _id: newFileId },
          {
            $set: {
              "attachment.isUploading": "Completed",
              "attachment.file_url": file_url,
            },
          },
          { new: true }
        );

        //Adds newFileId to attachments array in messages
        await Chat.findOneAndUpdate(
          {
            _id: chat_id,
            $or: [
              { creator_id: sender_id },
              { participants: { $in: [sender_id] } },
            ],
            "messages._id": message_id,
          },
          { $push: { "messages.$.attachments": newFileId } },
          { new: true }
        );

        req.io.sockets.emit("uploadedFileSuccess", updatedFile);

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
