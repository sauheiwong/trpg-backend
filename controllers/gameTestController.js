import { Ollama } from "ollama";

import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

const ollama = new Ollama();

const chatModel = "qwen3:4b";

const chatWithQwenNew = async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).send({ message: "please provide message" });
  }

  const modelResponse = await ollama.chat({
    model: chatModel,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    think: false,
  });

  const modelResponseMessage = modelResponse.message.content;

  const newConversation = await Conversation.create({
    userId: req.user._id,
    title: "New Game",
  });

  const newUserMessage = await Message.create({
    conversationId: newConversation._id,
    role: "user",
    content: userMessage,
  });

  const newModelMessage = await Message.create({
    conversationId: newConversation._id,
    role: "assistant",
    content: modelResponseMessage,
  });

  return res.status(200).send({
    modelMessage: modelResponseMessage,
    conversationId: newConversation._id,
  });
};

const chatWithQwen = async (req, res) => {
  const conversationId = req.params.id;
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).send({ message: "please provide message" });
  }
};

export default {
  chatWithQwenNew,
};
