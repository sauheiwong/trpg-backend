import { Ollama } from "ollama";

import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

import conversationHandlers from "../handlers/conversationHandlers.js";

import { errorReturn } from "../handlers/errorHandlers.js";

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

  await Message.create({
    conversationId: newConversation._id,
    role: "user",
    content: userMessage,
  });

  await Message.create({
    conversationId: newConversation._id,
    role: "assistant",
    content: modelResponseMessage,
  });

  return res.status(200).send({
    modelMessage: modelResponseMessage,
    conversationId: newConversation._id,
  });
};

const chatInConservationById = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).send({ message: "please provide message" });
  }

  try {
    const conversation = await conversationHandlers.getConservationById(
      conversationId,
      userId
    );

    const modelResponse = await ollama.chat({
      model: chatModel,
      messages: conversation.messages,
      think: false,
    });

    const modelResponseMessage = modelResponse.message.content;

    console.log(`${chatModel} say: ${modelResponseMessage}`);

    await Message.create({
      conversationId: conversationId,
      role: "user",
      content: userMessage,
    });

    await Message.create({
      conversationId: conversationId,
      role: "assistant",
      content: modelResponseMessage,
    });

    return res.status(200).send({ message: modelResponseMessage });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  chatWithQwenNew,
  chatInConservationById,
};
