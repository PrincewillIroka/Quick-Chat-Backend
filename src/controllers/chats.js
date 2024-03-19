import fs from "fs";
import path from "path";
import { generateChatUrl, encryptData, decryptData } from "../utils";
import Chat from "../models/Chat";
import File from "../models/File";
import { uploader } from "../services";
import config from "../config";

const createChat = async (req, res) => {
  try {
    const { creator_id, passcode, chat_name } = req.body;
    const chat_url = generateChatUrl(); //Todo: Ensure chat_url is unique from others in the db Chat model

    const participants = [creator_id];

    let encryptedPasscode;

    if (passcode) {
      encryptedPasscode = encryptData(passcode);
    }

    let newChat = await Chat.create({
      creator_id,
      chat_url,
      ...(encryptedPasscode && { passcode: encryptedPasscode }),
      participants,
      chat_name,
    });
    newChat = await newChat.populate([
      {
        path: "participants",
        select: ["name", "photo", "isChatBot"],
      },
    ]);
    res.send({ success: true, newChat });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const uploadFile = async (req, res) => {
  try {
    const { chat_id, chat_url, sender_id, message_id } = req.body;
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
        try {
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

            fileUploadResult = await fs.writeFile(
              file_path,
              data,
              (err, rs) => {
                if (err) throw err;
                return rs;
              }
            );
          } else {
            fileUploadResult = await uploader(value.tempFilePath, chat_id).then(
              async (result) => result
            );
            file_url = fileUploadResult.secure_url;
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

          req.io.to(chat_url).emit("uploaded-file-success", updatedFile);

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
        } catch (error) {
          console.error(error);
        }
      }
    })();

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const updateAccessRight = async (req, res) => {
  try {
    const { chat_id, user_id, passcode } = req.body;
    let success, updatedChat;

    const chat = await Chat.findById(chat_id).lean();

    if (chat) {
      const decryptedPasscode = decryptData(chat.passcode);

      if (decryptedPasscode === passcode) {
        updatedChat = await Chat.findByIdAndUpdate(
          { _id: chat_id },
          {
            $push: {
              access_rights: user_id,
              participants: user_id,
            },
          },
          { new: true }
        )
          .populate([
            {
              path: "participants",
              select: ["name", "photo", "isChatBot"],
            },
            {
              path: "messages.sender",
              select: ["name", "photo", "isChatBot"],
            },
            {
              path: "messages.attachments",
            },
          ])
          .lean();

        success = true;

        //To do: Emit event to other users that a new participant has joined the chat.
      } else {
        success = false;
      }
    } else {
      success = false;
    }

    res.send({ success, ...(updatedChat && { updatedChat }) });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat, uploadFile, updateAccessRight };
