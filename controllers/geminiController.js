import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import gameHandlers from "../handlers/gameHandlers.js";
import messageHandlers from "../handlers/messageHandlers.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage) => {
  return `
    你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家完成一次充滿未
        知、恐怖和瘋狂的冒險。
    **開場**：首先，你需要主動向玩家提問，以確定劇本的基礎設定，例
        如：時代背景、故事發生的地點、玩家的角色概念、劇本的恐怖類型（
        如宇宙恐怖、心理恐怖、血腥等）和角色數值設定等等。
    **氛圍營造**：克蘇魯神話的核心是未知。在劇情描述中，絕對不要直
        接說出神話生物或舊日支配者的名字。要用側面描寫、環境暗示和令人
        不安的細節來營造恐怖和懸疑的氣氛。
    **角色控制**：你絕對不能代替玩家控制他們所扮演的角色（PC
        ）。玩家的行動、思想和決定完全由他們自己掌握。
    **NPC控制**：與此同時，遊戲世界中所有的非玩家角色（NPC
        ）都由你來控制。你需要根據他們的性格和動機，對玩家的行動做出合
        情合理的回應。
    **骰子系統**: 根據克蘇魯的呼喚的規則，去通知玩家投擲骰子。通知的格式為
    :「(類別) (角色現有數值): (原因)」 
    例如:「偵查 (70%)：你試圖在這混亂的設計中找出任何有意義的圖案、標記或線索。」
    **不要代替玩家投擲和進行檢定**
    **當玩家需要投擲骰子進行檢定時**: 當玩家需要去投擲骰子進行檢定(例如: 要1d100)的時候，
        用[請在輸入橫中輸入"/roll 1d100" 系統會幫你投擲並將結果回傳給我] 
        告知玩家去親手投擲 增加投入感
        如果收到錯誤的投擲結果 請告知玩家去投擲正確的骰子
    **投擲判斷時的格式**: 在使用者的輸入中，你可能會看到以 [系統擲骰結果]
        開頭的標籤。這不是玩家的直接發言，而是遊戲系統提供的擲骰結果。
        [系統擲骰結果] 告訴你該行動的成敗。你必須根據這個結果來生成劇情。
        如果結果是『75 <= 80, 成功』，就生動地描述玩家如何成功; 
        如果是『90 > 50, 失敗』，就描述失敗的場景和後果; 
        如果結果是『4 <= 80, 大成功』，就生動地描述玩家如何成功，並且**提供更好的結果**;
        如果是『99 > 50, 大失敗』，就描述失敗的場景和**更壞的後果**。
        絕對不要在你的回覆中直接提及『擲骰』或『成功/失敗』這些字眼，而是要將結果融入到故事敘述中。
   **語言**：請使用${userLanguage}進行所有對話。
                    `;
};

const chatWithGeminiNew = async (req, res) => {
  const userId = req.user._id;

  //   return res.status(200).send({
  //     message: `歡迎，探索者。很高興你能加入這場冒險。

  // 在我們潛入那不可名狀的恐懼之前，讓我們先為這次探索建立一個基礎。請告訴我：

  // 1.  **故事的時代背景**：你希望這次冒險發生在什麼年代？是爵士樂盛行的咆0年代、維多利亞時代的霧都、還是更為 現代的時空？
  // 2.  **故事發生的地點**：故事將會在何處展開？是一個偏遠而詭異的鄉村、一座歷史悠久的大城市、還是一個孤立無援的小島？
  // 3.  **你的角色概念**：你希望扮演一個什麼樣的人物？是敏銳的偵探、博學的學者、手藝精湛的藝術家、還是樸實的普通市民？請給我一個大致的方向。
  // 4.  **你偏好的恐怖類型**：你希望這次冒險主要偏向哪種恐怖？是強調宇宙宏大與人類渺小的「宇宙恐怖」、深掘內心陰影與精神崩潰的「心理恐怖」、還是有更多血腥與生理不適的「肉體恐怖」？

  // 請慢慢思考，你的選擇將塑造我們共同編織的噩夢。
  //         `,
  //     gameId: "123123123",
  //   });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(req.user.language),
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(startPrompt);
    const modelResponseText = result.response.text();

    console.log("Model Response Text: ", modelResponseText);

    const game = await gameHandlers.createGame(userId);

    // await messageHandlers.createMessage(startPrompt, "user", game._id, userId);

    await messageHandlers.createMessage(
      modelResponseText,
      "model",
      game._id,
      userId
    );

    return res
      .status(200)
      .send({ message: modelResponseText, gameId: game._id });
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    return res
      .status(500)
      .send({ message: "fail to get response from AI, please try later" });
  }
};

const chatWithGeminiById = async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user._id;
  const userMessage = req.body.message;
  const role = req.body.role || "user";

  if (!userMessage || userMessage.length === 0) {
    return res.status(400).send({ message: "please provide your message" });
  }

  const { messages } = await gameHandlers.getGameById(gameId, userId);

  const processedMessage = [
    ...[
      {
        role: "user",
        parts: [{ text: startPrompt }],
      },
    ],
    ...messages.map((message) => {
      // console.log(
      //   `message.role is: ${
      //     message.role
      //   }, message.role === "model" ? "model" : "user" is: ${
      //     message.role === "model" ? "model" : "user"
      //   }`
      // );
      return {
        role: message.role === "model" ? "model" : "user",
        parts: [{ text: message.content }],
      };
    }),
  ];

  // return res.status(200).send({
  //   message: `got your message`,
  // });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt(req.user.language),
      },
    });

    const chat = model.startChat({
      history: processedMessage,
    });

    const result = await chat.sendMessage(userMessage);

    const modelResponseText = result.response.text();

    console.log("Model Response Text: ", modelResponseText);

    if (role === "system") {
      await messageHandlers.createMessage(
        req.body.userMessage,
        "user",
        gameId,
        userId
      );
    }

    await messageHandlers.createMessage(userMessage, role, gameId, userId);

    await messageHandlers.createMessage(
      modelResponseText,
      "model",
      gameId,
      userId
    );

    return res.status(200).send({ message: modelResponseText });
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    return res
      .status(500)
      .send({ message: "fail to get response from AI, please try later" });
  }
};

export default {
  chatWithGeminiNew,
  chatWithGeminiById,
};
