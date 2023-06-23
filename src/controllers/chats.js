import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";
import File from "../models/File";
import fs from "fs";
import path from "path";

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
    const { chat_id, sender_id } = req.body;
    const files = req.files;

    const folder_path = `static/chat_images/${chat_id}`;

    const staticFolder = path.join(process.cwd(), folder_path);
    if (!fs.existsSync(staticFolder)) {
      fs.mkdirSync(staticFolder, { recursive: true });
    }

    for (const file of Object.values(files)) {
      const { name: fileName, data } = file;
      const url = `${folder_path}/${fileName}`;

      // Todo: If file exists, append a number to filename to avoid duplicates
      fs.writeFile(url, data, (err, rs) => {
        if (err) throw err;
        req.io.sockets.emit("uploadedFileSuccess", { chat_id, sender_id });
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

    res.send({});
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat, uploadFile };
