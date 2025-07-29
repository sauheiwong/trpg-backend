import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import characterChatHandlers from "../handlers/characterChatHandlers.js";
import characterHandlers from "../handlers/characterHandlers.js";
import characterChatMessageHandlers from "../handlers/characterChatMessageHandlers.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage) => {
  return `
    你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家創建一個新的角色卡。玩家可以用傳統的擲骰方式或者點數購買方式去創建角色卡。
    **必要屬性**: 
      | 屬性 | 投骰方式 | 購買方式 | 意義 |
      | --- | --- | --- | --- |
      | 力量(STR) | 3d6 * 5 | 15至90 | 肌肉強度。影響肌肉爆發力與負重能力 |
      | 體質(CON) | 3d6 * 5 | 15至90 | 健康、生命力與耐久力。影響對打擊、疾病、身體惡化的抵抗能力 |
      | 體型(SIZ) | (2d6 + 6) * 5 | 15至90 | 身高體重的綜合。影響是否方便移動、穿梭，並對生命力與體格造成影響 |
      | 敏捷(DEX) | 3d6 * 5 | 15至90 | 更快、更靈活、更好的肉體彈性。在戰鬥時，可以更快進行動作 |
      | 外貌(APP) | 3d6 * 5 | 15至90 | 既包括肉體吸引力，也包括人格。決定是否迷人討喜。影響到社交時的第一印象 |
      | 智力(INT) | (2d6 + 6) * 5 | 15至90 | 學習、理解、分析資訊與解決難題的能力。影響到個人興趣的品質 |
      | 意志(POW) | 3d6 * 5 | 15至90 | 對魔法的資質與抗性。影響到心智強度與魔法力多寡 |
      | 教育(EDU) | (2d6 + 6) * 5 | 15至90 | 擁有的正式知識的多寡。影響到該職業受到多少訓練與能力的好壞 |
      | 幸運(LUCK) | 3d6 * 5 | 不適用 | 代表這個人的運勢有多好,
    **基本數值**:
      | 數值 | 計算方法 
      | --- | --- |
      | 血量(HP) | (SIZ + CON) / 10 （小數位捨去）|
      | 魔法力(MP) | POW /5（小數位捨去） |
      | 理智(SAN) | POW |
    **角色描述**
      職業: string,
      個人描述: string,
    **技能**: 根據角色的職業和興趣有額外的技能 
      請用
        {
          name: string,
          value: 1至100,
        }
        的方式去儲存和顯示
    **武器的傷害加乘**:  根據角色的職業和興趣可以有自己的武器
      請用
        {
          name: string,
          damage: string (eg. 1d4, 3d8 + 4),
        }
        的方式去儲存和顯示
   **語言**：請使用${userLanguage}進行所有對話。
    `;
};

const chatWithGeminiNew = async (req, res) => {
  const userId = req.user._id;

  //   return res.status(200).send({
  //     message: `
  //     哈囉，旅人。歡迎來到一個你可能不曾想像過的世界。
  // 我是**說書人**，或稱作**守密人（Keeper，簡稱KP）**，將會引導你體驗這趟旅程，描繪眼前的景物，扮演所有你將會遇到的人事物，並執行遊戲的規則。

  // 這是**《克蘇魯的呼喚》（Call of Cthulhu）**。這不是那種你所熟悉的英雄傳奇，在這裡，你不會找到巨龍或閃亮的寶劍。這是一個**恐懼、神秘與調查**的遊 戲。你將會扮演一個在20世紀20年代的普通人（或者說，在我們開始你的故事時，你還算是個普通人），在看似日常的世界中，一步步揭開宇宙中潛藏的恐怖真相。

  // 至於我們要做的……首先，我們將**創造一個屬於你的角色**。他或她將會是你進入這個瘋狂世界的雙眼與雙腳。我們會決定你的背景、職業、能力，以及你可能擁有的財富和秘密。當你的角色準備就緒後，我們就會一同踏入一場冒險，一場充滿不可名狀之物、古老知識和逐漸流失理智的旅程。你的目標將是活下來，並盡可能地保持你的心智健全……儘管這往往是個奢望。

  // 準備好了嗎？讓我們從你這位角色的誕生開始吧。你希望你的角色會是怎樣的人呢？我們可以用隨機投擲的方式來決定角色的基礎屬性，或者，你可以告訴我你對角色的一些初步想法，例如他或她的性別、年齡，或者大致上是個什麼樣的人？
  //     `,
  //     chatId: "6889136e7a05c942ca00eb5a",
  //   });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(req.user.language),
    });

    const AIchat = model.startChat({
      history: [],
    });

    const result = await AIchat.sendMessage(startPrompt);
    const modelResponseText = result.response.text();

    // const modelResponseText = `
    //     哈囉，旅人。歡迎來到一個你可能不曾想像過的世界。
    // 我是**說書人**，或稱作**守密人（Keeper，簡稱KP）**，將會引導你體驗這趟旅程，描繪眼前的景物，扮演所有你將會遇到的人事物，並執行遊戲的規則。

    // 這是**《克蘇魯的呼喚》（Call of Cthulhu）**。這不是那種你所熟悉的英雄傳奇，在這裡，你不會找到巨龍或閃亮的寶劍。這是一個**恐懼、神秘與調查**的遊 戲。你將會扮演一個在20世紀20年代的普通人（或者說，在我們開始你的故事時，你還算是個普通人），在看似日常的世界中，一步步揭開宇宙中潛藏的恐怖真相。

    // 至於我們要做的……首先，我們將**創造一個屬於你的角色**。他或她將會是你進入這個瘋狂世界的雙眼與雙腳。我們會決定你的背景、職業、能力，以及你可能擁有的財富和秘密。當你的角色準備就緒後，我們就會一同踏入一場冒險，一場充滿不可名狀之物、古老知識和逐漸流失理智的旅程。你的目標將是活下來，並盡可能地保持你的心智健全……儘管這往往是個奢望。

    // 準備好了嗎？讓我們從你這位角色的誕生開始吧。你希望你的角色會是怎樣的人呢？我們可以用隨機投擲的方式來決定角色的基礎屬性，或者，你可以告訴我你對角色的一些初步想法，例如他或她的性別、年齡，或者大致上是個什麼樣的人？
    //     `;

    console.log("Model Response Text: ", modelResponseText);

    const newCharacter = await characterHandlers.createCharacter(userId);

    const chat = await characterChatHandlers.createCharacterChat(
      userId,
      newCharacter._id
    );

    await characterChatMessageHandlers.createMessage(
      modelResponseText,
      "model",
      chat._id,
      userId
    );

    return res.status(200).send({
      message: modelResponseText,
      chatId: chat._id,
      characterId: newCharacter._id,
    });
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    return res
      .status(500)
      .send({ message: "fail to get response from AI, please try later" });
  }
};

const chatWithGeminiById = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user._id;
  const userMessage = req.body.message;
  const role = req.body.role || "user";

  if (!userMessage || userMessage.length === 0) {
    return res.status(400).send({ message: "please provide your message" });
  }

  const { messages } = await characterChatHandlers.getChatById(chatId, userId);

  const processedMessage = [
    ...[
      {
        role: "user",
        parts: [{ text: startPrompt }],
      },
    ],
    ...messages.map((message) => {
      return {
        role: message.role === "model" ? "model" : "user",
        parts: [{ text: message.content }],
      };
    }),
  ];

  // console.log("processedMessage is: ", processedMessage);

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

    await characterChatMessageHandlers.createMessage(
      userMessage,
      role,
      chatId,
      userId
    );

    await characterChatMessageHandlers.createMessage(
      modelResponseText,
      "model",
      chatId,
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
