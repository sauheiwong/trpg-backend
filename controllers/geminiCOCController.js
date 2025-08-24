import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import gameHandlers from "../handlers/gameHandlers.js";
import messageHandlers from "../handlers/messageHandlers.js";

import rollDiceTool from "../tools/COC/rollDiceTool.js";
import saveCharacterTool from "../tools/COC/saveCharacterTool.js";

import { io } from "../app.js";

const tokenLimit = 10**6;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage, haveCharacter) => {
  if (haveCharacter)
    return `
{
  "profile": {
    "identity": "專業、友善且高效的《克蘇魯的呼喚》TRPG 守密人 (KP)。",
    "primary_task": "引導玩家完成充滿未知、恐怖和瘋狂的冒險，並根據他們的行動推動劇情。",
    "communication_style": "清晰、簡潔，善於用側面描寫和細節營造懸疑恐怖的氣氛。"
  },
  "core_gameplay_loop": [
    "1. 聆聽與澄清：仔細聆聽玩家的行動描述。若描述模糊（如『我用工具』），必須追問細節（『什麼工具？』）以確保行動合理可行。",
    "2. 判斷檢定：根據玩家行動和規則，判斷是否需要能力檢定。若行動極其簡單或必然成功/失敗，則直接進行敘事。",
    "3. 發起檢定或敘事：若需檢定，必須立即呼叫 'rollSingleDice' 工具，並在 'reason' 參數中描述檢定原因（格式：'檢定名稱 (目標值%): 原因'）。若無需檢定，則直接進行敘事。"
  ],
  "rules": {
    "tool_usage": {
      "rollSingleDice": "這是你唯一被允許的擲骰方式，用以確保公平。所有NPC或環境隨機事件均須使用此工具。",
      "secret_rolls": "如需進行暗骰（如心理學），在呼叫 'rollSingleDice' 工具時，在參數中加入 'secret: true'。"
    },
    "system_input_interpretation": {
      "format": "你將收到包含擲骰結果的JSON物件，格式為：{ 'roll': 75, 'target': 80, 'success': true, 'criticality': 'normal', 'abilityName': '偵查' }",
      "response_structure": {
        "step_1_header": "必須在回覆的【第一行】生成「結果標頭」，格式為：'【<能力名稱>檢定：<擲骰結果>/<目標值> -> <成功/失敗/大成功/大失敗>】'。範例：【偵查檢定：75/80 -> 成功】。",
        "step_2_narrative": "在標頭後【換行】，開始撰寫詳細的劇情描述。敘事中應避免重複提及成功/失敗或具體數字，要將結果完全融入故事。"
      },
      "interpretation_details": {
        "success": "生動地描述成功的場景。",
        "failure": "描述失敗的場景和後果。",
        "critical_success": "描述大成功，並提供意想不到的正面效果。",
        "critical_fumble": "描述大失敗，並觸發更糟糕的負面後果。"
      }
    }
  },
  "narrative_style_guide": {
    "atmosphere": "核心是未知恐怖。絕對禁止直呼神話生物或舊日支配者之名。使用環境暗示、感官細節、異常現象營造氛圍，強調玩家在未知面前的渺小與無力。",
    "character_control": "嚴守玩家代理權，絕不替玩家角色（PC）做任何決定。你控制所有非玩家角色（NPC），並使其行動符合其性格動機。"
  },
  "language": "${userLanguage}"
}
                    `;
  return ` 
你必須嚴格遵循以下的JSON指令塊來扮演CoC KP的角色：
{
  "persona": "專業、友善、高效的CoC TRPG守密人(KP)。",
  "primary_goal": "引導無角色玩家(hasCharacter: false)完成創角流程。",
  "decision_flow": {
    "no_character": "嚴格遵循: 1.熱情歡迎並解釋創角選項(隨機擲骰/點數購買)，詢問偏好。 2.若玩家選'隨機擲骰'並要求代勞，必須立即且唯一地使用'rollCharacterStatus'工具，禁止事前對話，直接呈現JSON結果後再解釋。 3.若玩家選'點數購買'，告知總點數460(範圍15-90)並引導分配。 4.玩家確認完成後，必須使用'saveCharacterStatus'工具儲存。"
  },
  "rules": {
    "tool_usage": {
      "no_fake_rolls": true,
      "character_creation": "必須使用 'rollCharacterStatus'",
      "ingame_checks": "必須使用 'rollSingleDice'"
    }
  },
  "knowledge_base": {
    "attributes": {
      "STR": {"roll": "(3d6)*5", "buy_range": "15-90"},
      "CON": {"roll": "(3d6)*5", "buy_range": "15-90"},
      "SIZ": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
      "DEX": {"roll": "(3d6)*5", "buy_range": "15-90"},
      "APP": {"roll": "(3d6)*5", "buy_range": "15-90"},
      "INT": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
      "POW": {"roll": "(3d6)*5", "buy_range": "15-90"},
      "EDU": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
      "LUCK": {"roll": "(3d6)*5", "buy_range": "N/A"}
    },
    "derived_stats": {
      "HP": "floor((SIZ+CON)/10)",
      "MP": "floor(POW/5)",
      "SAN": "POW"
    },
    "skill_points": {
      "occupation": "依職業公式計算 (例: 作家=EDU*4)",
      "interest": "INT*2"
    }
  },
  "language": "${userLanguage}"
}
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
      systemInstruction: systemPrompt(req.user.language, false),
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

  const { messages, characterId } = await gameHandlers.getGameById(
    gameId,
    userId
  );

  const hasCharacter = characterId ? true : false;
  // const hasCharacter = true;

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
      availableTools["saveCharacterStatus"] =
        saveCharacterTool.saveCharacterStatus;
      availableTools["rollCharacterStatus"] = rollDiceTool.rollCharacterStatus;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          rollDiceTool.rollCharacterStatusDeclaration,
          saveCharacterTool.saveCharacterStatusDeclaration,
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

    let newCharacter = null;

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

      if (toolResult.newCharacter) {
        newCharacter = toolResult.newCharacter;
      }

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: {
              content: String(toolResult.message),
            },
          },
        },
      ]);
    }

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

    return res.status(200).send({ message: modelResponseText, newCharacter });
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    return res
      .status(500)
      .send({ message: "fail to get response from AI, please try later" });
  }
};

const handlerNewCOCChat = async (socket) => {
  console.log("gemini start to run 🤖")
  const userId = socket.user._id;
  const userLanguage = socket.user.language;

  try{
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(userLanguage, false),
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(startPrompt);
    const modelResponseText = result.response.text();

    console.log("Model Response Text: ", modelResponseText);

    const game = await gameHandlers.createGame(userId);
    const gameId = game._id;

    await messageHandlers.createMessage(
      modelResponseText,
      "model",
      gameId,
      userId
    );

    socket.emit("game:created", {
      message: modelResponseText,
      gameId: gameId
    })
    
    socket.join(gameId);
    console.log(`player ${socket.user.username} join game room ${gameId}`)
  } catch (error) {
    console.error("Error ⚠️ in handlerNewCOCChat: fail to call Gemini API: ", error);
    socket.emit("game:createError", {
      message: "fail to get response from AI, please try later."
    })
  }
}

const handlerUserMessageCOCChat = async (data, user) => {
  const { gameId, message } = data;
  const userId = user._id;
  const language = user.language;
  if (!message || message.length === 0) {
    throw Error("please provide your message.")
  }

  const { messages, characterId } = await gameHandlers.getGameById(
    gameId,
    userId
  );

  const hasCharacter = characterId ? true : false;

  // need to improve to reduce token useage---------------------

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

  //-------------------------------------------------------------

  try {
    const availableTools = {
      rollSingleDice: rollDiceTool.rollSingleDice,
    };

    let functionDeclarations = [rollDiceTool.rollSingleDiceDeclaration];

    console.log("hasCharacter: ", hasCharacter);

    if (!hasCharacter) {
      availableTools["saveCharacterStatus"] =
        saveCharacterTool.saveCharacterStatus;
      availableTools["rollCharacterStatus"] = rollDiceTool.rollCharacterStatus;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          rollDiceTool.rollCharacterStatusDeclaration,
          saveCharacterTool.saveCharacterStatusDeclaration,
        ],
      ];
    }
    // count token-------------------------------------------------
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt(language, hasCharacter),
      tools: [{ functionDeclarations }],
    });

    const requestContent = {
      contents: [
        ...processedMessage,
        { role: "user", parts: [{ text: message }] }
      ]
    }

    const { totalTokens } = await model.countTokens(requestContent);
    console.log("The total token is: ", totalTokens);
    // --------------------------------------------------------------

    if ( totalTokens > tokenLimit ) {
      throw new Error("Content window is too large, aborting request.");
    }

    const chat = model.startChat({
      history: processedMessage,
    });

    let result = await chat.sendMessage(message);

    let newCharacter = null;

    const MAX_TURNS = 5;
    for (let i = 0; i < MAX_TURNS; i++) {
      console.log("start checking model used function call or not.")
      const call =
        result.response.candidates[0]?.content?.parts[0]?.functionCall;

      if (!call) {
        console.log("model don't have use function call.")
        break;
      }

      call.args["userId"] = userId;
      call.args["gameId"] = gameId;

      console.log("model wants to call a function: ", call.name);
      console.log("white arguments: ", call.args);

      const tool = availableTools[call.name];

      if (!tool) {
        throw errorStatus(`function ${call.name} not found`, 500);
      }

      const toolResult = await tool(call.args);

      console.log("function execution result: ", toolResult);

      if (toolResult.newCharacter) {
        newCharacter = toolResult.newCharacter;
      }

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        },
      ]);
    }

    const modelResponseText = result.response.text();

    console.log("Model Response Text: ", modelResponseText);

    await messageHandlers.createMessage(message, "user", gameId, userId);

    await messageHandlers.createMessage(
      modelResponseText,
      "model",
      gameId,
      userId
    );

    io.to(gameId).emit("message:received", { message: modelResponseText, role: "model" });
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    io.to(gameId).emit("message:error", { error: "Error ⚠️: fail to call Gemini API" })
  }
}

export default {
  chatWithGeminiNew,
  chatWithGeminiById,
  handlerNewCOCChat,
  handlerUserMessageCOCChat,
};
