import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import characterChatHandlers from "../handlers/characterChatHandlers.js";
import characterHandlers from "../handlers/characterHandlers.js";
import characterChatMessageHandlers from "../handlers/characterChatMessageHandlers.js";

import rollDiceTool from "../tools/COC/rollDiceTool.js";
import saveCharacterTool from "../tools/COC/saveCharacterTool.js";
import { errorStatus } from "../handlers/errorHandlers.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage) => {
  return `
    你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家創建一個新的角色卡。玩家可以用傳統的擲骰方式或者點數購買方式去創建角色卡。
    **必要屬性**: 
      | 屬性 | 投骰方式 | 購買方式 | 意義 |
      | --- | --- | --- | --- |
      | 力量(STR) | ( 3d6 ) 然後將數值乘以 5 | 15至90 | 肌肉強度。影響肌肉爆發力與負重能力 |
      | 體質(CON) | ( 3d6 ) 然後將數值乘以 5 | 15至90 | 健康、生命力與耐久力。影響對打擊、疾病、身體惡化的抵抗能力 |
      | 體型(SIZ) | (2d6 + 6) 然後將數值乘以 5 | 15至90 | 身高體重的綜合。影響是否方便移動、穿梭，並對生命力與體格造成影響 |
      | 敏捷(DEX) | ( 3d6 ) 然後將數值乘以 5 | 15至90 | 更快、更靈活、更好的肉體彈性。在戰鬥時，可以更快進行動作 |
      | 外貌(APP) | ( 3d6 ) 然後將數值乘以 5 | 15至90 | 既包括肉體吸引力，也包括人格。決定是否迷人討喜。影響到社交時的第一印象 |
      | 智力(INT) | (2d6 + 6) 然後將數值乘以 5 | 15至90 | 學習、理解、分析資訊與解決難題的能力。影響到個人興趣的品質 |
      | 意志(POW) | ( 3d6 ) 然後將數值乘以 5 | 15至90 | 對魔法的資質與抗性。影響到心智強度與魔法力多寡 |
      | 教育(EDU) | (2d6 + 6) 然後將數值乘以 5 | 15至90 | 擁有的正式知識的多寡。影響到該職業受到多少訓練與能力的好壞 |
      | 幸運(LUCK) | ( 3d6 ) 然後將數值乘以 5 | 不適用 | 代表這個人的運勢有多好 |
      玩家選擇投骰的話，你先將以上的表格提供給玩家，叫玩家可以自行投骰子
    **擲骰規則**:
      1.  當你需要為玩家或任何NPC擲骰時，**你絕對不可以直接在回覆中編造或模擬擲骰結果**。
      2. 當玩家選擇擲骰方式來創建角色，並要求你為他擲骰時，**你必須呼叫 rollCharacterStats工具**來生成所有屬性。將工具回傳的完整結果呈現給玩家。
      3.  **除此之外，你唯一被允許的擲骰方式，就是呼叫 rollSingleDice 這個工具函式**。這是為了確保遊戲的絕對公平性。
      4.  如果玩家要求你擲骰，或是劇情需要擲骰，你必須立即使用 rollSingleDice 工具。
    **基本數值**:
      | 數值 | 計算方法 |
      | --- | --- |
      | 血量(HP) | (SIZ + CON) / 10 （小數位捨去）|
      | 魔法力(MP) | POW /5（小數位捨去） |
      | 理智(SAN) | POW |
    **角色的職業點數**: 根據克蘇魯的呼喚7版規則去分配點數，不過不會太多，例如: 作家是EDU乘以4，運動員是 EDU x2 + (DEX 或者 STR) x2。
    **角色的個人興趣點數**: INT乘以2。
    **儲存角色資料**:
      **當玩家完成角色卡並要求你儲存時，你必須立即使用 saveCharacterStatus 工具。**這工具可以將角色卡的資料儲存在系統中，在之後的冒險調用。
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

    console.log("Model Response Text: ", modelResponseText);

    const chat = await characterChatHandlers.createCharacterChat(userId);

    await characterChatMessageHandlers.createMessage(
      modelResponseText,
      "model",
      chat._id,
      userId
    );

    return res.status(200).send({
      message: modelResponseText,
      chatId: chat._id,
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
    const availableTools = {
      rollSingleDice: rollDiceTool.rollSingleDice,
      rollCharacterStatus: rollDiceTool.rollCharacterStatus,
      saveCharacterStatus: saveCharacterTool.saveCharacterStatus,
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(req.user.language),
      tools: [
        {
          functionDeclarations: [
            rollDiceTool.rollSingleDiceDeclaration,
            rollDiceTool.rollCharacterStatusDeclaration,
            saveCharacterTool.saveCharacterStatusDeclaration,
          ],
        },
      ],
    });

    const chat = model.startChat({
      history: processedMessage,
    });

    let result = await chat.sendMessage(userMessage);

    // return res.status(200).send({ result });

    while (true) {
      console.log("start check call");
      const call =
        result.response.candidates[0]?.content?.parts[0]?.functionCall;

      if (!call) {
        console.log("not function call.");
        break;
      }

      console.log("model wants to call a function: ", call.name);
      console.log("white arguments: ", call.args);

      const tool = availableTools[call.name];

      if (!tool) {
        throw errorStatus(`function ${call.name} not found`, 500);
      }

      // call.args.userId = userId

      const toolResult = tool(call.args, userId);

      console.log("function execution result: ", toolResult);
      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: {
              content: String(toolResult),
            },
          },
        },
      ]);
    }
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
