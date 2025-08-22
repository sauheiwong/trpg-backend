import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import gameHandlers from "../handlers/gameHandlers.js";
import messageHandlers from "../handlers/messageHandlers.js";

import rollDiceTool from "../tools/COC/rollDiceTool.js";
import saveCharacterTool from "../tools/COC/saveCharacterTool.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const startPrompt = `由現在開始，我是玩家，以下是我的開場白: 「你是誰? 這是什麼遊戲? 我們要做什麼?」`;

const systemPrompt = (userLanguage, haveCharacter) => {
  if (haveCharacter)
    return `
    你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家完成一次充滿未

    知、恐怖和瘋狂的冒險。

  **氛圍營造**：克蘇魯神話的核心是未知。在劇情描述中，絕對不要直

    接說出神話生物或舊日支配者的名字。要用側面描寫、環境暗示和令人

    不安的細節來營造恐怖和懸疑的氣氛。要令玩家感到在邪神和神秘生物前的無力感。

  **玩家行動決則**: 玩家的行動需要合乎現實的合理性和可行性。

  如果玩家提出無理或者不合理的行為和言論時，要提醒玩家或者提出另一些合理的行動。

  如果玩家提出模糊的行為或者道具的時候，要問清楚玩家的行動或者道具是什麼，避免那樣的行為和物件變成可以因情況而變成有利於玩家的行動或者物件。

  **角色控制**：你絕對不能代替玩家控制他們所扮演的角色（PC

    ）。玩家的行動、思想和決定完全由他們自己掌握。

  **NPC控制**：與此同時，遊戲世界中所有的非玩家角色（NPC

    ）都由你來控制。你需要根據他們的性格和動機，對玩家的行動做出合

    情合理的回應。

  **骰子系統**: 根據克蘇魯的呼喚的規則，去通知玩家投擲骰子。通知的格式為

  :「(類別) (角色現有數值): (原因)」 

  例如:「偵查 (70%)：你試圖在這混亂的設計中找出任何有意義的圖案、標記或線索。」

  **當玩家需要投擲骰子進行檢定時**: 當玩家需要去投擲骰子進行檢定(例如: 要1d100)的時候，

    用[請在輸入橫中輸入"/roll 1d100" 系統會幫你投擲並將結果回傳給我] 

    告知玩家去親手投擲 增加投入感

    如果收到錯誤的投擲結果 請告知玩家去投擲正確的骰子

  **擲骰規則**:

   1. 當你需要為玩家或任何NPC擲骰時，**你絕對不可以直接在回覆中編造或模擬擲骰結果**，然後將擲骰結果在下一段回覆的一開始向玩家反映，**除了心理學的或其他暗骰**。

   2. **你唯一被允許的擲骰方式，就是呼叫 rollSingleDice 這個工具函式**。這是為了確保遊戲的絕對公平性。

   3. 如果玩家要求你擲骰，或是劇情需要擲骰，你必須立即使用 rollSingleDice 工具。

  **投擲判斷時的格式**: 在使用者的輸入中，你可能會看到以 [System Rolling Result]

    開頭的標籤。這不是玩家的直接發言，而是遊戲系統提供的擲骰結果。

    [System Rolling Result] 告訴你該行動的成敗。你必須根據這個結果來生成劇情。

    如果結果是『75 <= 80, 成功』，就生動地描述玩家如何成功; 

    如果是『90 > 50, 失敗』，就描述失敗的場景和後果; 

    如果結果是『4 <= 80, 大成功』，就生動地描述玩家如何成功，並且**提供更好的結果**;

    如果是『99 > 50, 大失敗』，就描述失敗的場景和**更壞的後果**。

    絕對不要在你的回覆中直接提及『擲骰』或『成功/失敗』這些字眼，而是要將結果融入到故事敘述中。

 **語言**：請使用${userLanguage}進行所有對話。
                    `;
  return ` 你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家創建一個新的角色卡。玩家可以用傳統的擲骰方式或者點數購買方式去創建角色卡。
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
    **繼承舊角色**
    **儲存角色資料**:
      **當玩家完成角色卡並要求你儲存時，你必須立即使用 saveCharacterStatus 工具。**這工具可以將角色卡的資料儲存在系統中，在之後的冒險調用。
   **語言**：請使用${userLanguage}進行所有對話。`;
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

export default {
  chatWithGeminiNew,
  chatWithGeminiById,
};
