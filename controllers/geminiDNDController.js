import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import DNDGameHandlers from "../handlers/DNDGameHandlers.js";
import DNDMessageHandlers from "../handlers/DNDMessageHandlers.js";

import rollDiceTool from "../tools/DND/rollDiceTool.js";
import saveCharacterTool from "../tools/DND/saveCharacterTool.js";

import { errorStatus } from "../handlers/errorHandlers.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage, hasCharacter) => {
  if (hasCharacter)
    return `
   你是專業的龍與地下城（D&D 5e）地下城主（DM）。你的任務是為玩家提供一場引人入勝、充滿挑戰的冒險。
     **核心職責**：
     *   **世界描繪**：生動地描述場景、地點、氣氛和發生的事件。
     *   **NPC 扮演**：控制所有非玩家角色（NPC），根據他們的性格和動機與玩家互動。
     *   **規則裁決**：根據 D&D 5e規則，在適當時機要求玩家進行檢定。
     *   **玩家自主**：你絕對不能代替玩家控制他們的角色（PC）。
    
    **檢定與擲骰**：
    *    **要求檢定**：當玩家的行動結果不確定時，你需要根據情況要求玩家進行**屬性檢定 (Ability Check)**、**豁免檢定 (Saving Throw)** 或 **攻擊檢定 (Attack Roll)**。
    *   **檢定格式**：要求檢定時，格式為：「(檢定類型) (DC難度): (原因)」。例如：「隱匿檢定 (DC 15):你試圖悄悄溜過正在打盹的守衛。」或「體質豁免 (DC 13):你需要抵抗這團噁心的毒氣。」
    *   **通知玩家擲骰**：當需要玩家擲骰時，用 [請在輸入框中輸入 "/roll 1d20" 系統會幫你投擲並將結果回傳給我]的格式告知玩家。如果需要加值，也請一併提醒，例如：「請擲一個d20 並加上你的力量調整值」。
   
    **DM 為 NPC 擲骰**：
    當你需要為 NPC 或環境效果（如陷阱傷害）擲骰時，**你必須使用'rollSingleDice' 這個工具函式**，絕對不可以直接編造結果。
   
    **解讀系統擲骰結果**：你會在輸入中看到 '[System Rolling Result]'標籤，這是系統回傳的擲骰結果。你必須根據這個結果來推動劇情。
    *   **格式**：結果會像 'd20 + 3 = 18' 或 'd20 = 1'。
    *
      **敘事融合**：收到擲骰結果後，先在一開始將結果告訴玩家，然後繼續故事描述。除非是特定的暗骰，那就不可以告訴玩家結果。
        *   **成功** ('>= DC')：描述玩家如何漂亮地完成了他們的意圖。
        *   **失敗** ('< DC')：描述行動如何失手以及可能帶來的後果。
        *   **大成功** 'd20 = 20')：描述一個超乎預期的、絕佳的結果。
        *   **大失敗** ('d20 = 1')：描述一個災難性的、弄巧成拙的結果。
   **語言**：請使用${userLanguage}進行所有對話。
   `;
  return ` 
  你是專業的龍與地下城（D&D 5e）地下城主（DM）。你的任務是引導玩家創建一個新角色。
  **核心創建流程**：
  你將會一步步引導玩家完成以下步驟：
  1.**屬性點數**：解釋兩種生成方式（擲骰或點數購買），並根據玩家
      選擇執行。
  2.**種族與職業**：協助玩家選擇他們的種族和職業，並解釋其基本特
      性。
  3.**背景**：引導玩家選擇一個角色背景。
  4.**細節完善**：根據前面的選擇，確定生命值（HP
      ）、技能熟練項、裝備等。
  5.**最終定稿**：為角色命名，並賦予其簡單的個性和外觀描述。
   **屬性生成規則**：
   *
      **擲骰方式**：當玩家選擇擲骰，並要求你代勞時，你**必須**呼叫
      'rollCharacterStats'
      工具來一次性生成所有六項屬性（力量、敏捷、體質、智力、感知、
      魅力）。然後將工具回傳的結果完整呈現給玩家，讓他們分配到各屬
      性上。
   *
      **點數購買**：如果玩家選擇點數購買，你要向他們解釋規則（例如
      ：總共 27 點，8 點屬性花費 0 點，15 點屬性花費 9
      點等），並記錄他們的分配。
  
   **儲存角色資料**：
   **當玩家確認角色創建完成後，你必須立即使用'saveCharacterStatus' 工具。**這個工具會將角色卡儲存起來，以便在之後的冒險中調用。請務必收集到所有必要資訊（屬性、種族、職業、名稱）再呼叫此工具。
   **語言**：請使用${userLanguage}進行所有對話。
   `;
};

const chatWithGeminiNew = async (req, res) => {
  const userId = req.user._id;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(req.user.language, false),
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(startPrompt);
    const modelResponseText = result.response.text();

    console.log("Model Response Text: ", modelResponseText);

    const game = await DNDGameHandlers.createGame(userId);

    await DNDMessageHandlers.createMessage(
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

  const { messages, character } = await DNDGameHandlers.getGameById(
    gameId,
    userId
  );

  const hasCharacter = character ? true : false;

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

  // return res.status(200).send({
  //   message: `got your message`,
  // });

  try {
    const availableTools = {
      rollSingleDice: rollDiceTool.rollSingleDice,
    };

    let functionDeclarations = [rollDiceTool.rollSingleDiceDeclaration];

    console.log("hasCharacter: ", hasCharacter);

    if (!hasCharacter) {
      availableTools["saveDNDCharacter"] = saveCharacterTool.saveDNDCharacter;
      availableTools["rollCharacterStats"] = rollDiceTool.rollCharacterStats;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          rollDiceTool.rollCharacterStatsDeclaration,
          saveCharacterTool.saveDNDCharacterDeclaration,
        ],
      ];
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(req.user.language, hasCharacter),
      tools: [{ functionDeclarations }],
    });

    const chat = model.startChat({
      history: processedMessage,
    });

    let result = await chat.sendMessage(userMessage);

    // return res.status(200).send({ result });

    while (true) {
      const call =
        result.response.candidates[0]?.content?.parts[0]?.functionCall;

      if (!call) {
        break;
      }

      call.args["userId"] = userId;
      call.args["chatId"] = gameId;

      console.log("model wants to call a function: ", call.name);
      console.log("white arguments: ", call.args);

      const tool = availableTools[call.name];

      if (!tool) {
        throw errorStatus(`function ${call.name} not found`, 500);
      }

      const toolResult = await tool(call.args);

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

    if (role === "system") {
      await DNDMessageHandlers.createMessage(
        req.body.userMessage,
        "user",
        gameId,
        userId
      );
    }

    await DNDMessageHandlers.createMessage(userMessage, role, gameId, userId);

    await DNDMessageHandlers.createMessage(
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
