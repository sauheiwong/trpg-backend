import { GoogleGenAI } from "@google/genai";

import gameHandlers from "../handlers/gameHandlers.js";
import messageHandlers from "../handlers/messageHandlers.js";

import messageModel from "../models/messageModel.js";
import gameModel from "../models/gameModel.js";

import configService from "../services/config.service.js"

import { io } from "../app.js";
import { buildContextForLLM } from "../tools/COC/buildContextForLLMTool.js";

import rollDiceTool from "../tools/COC/rollDiceTool.js";
import saveCharacterTool from "../tools/COC/saveCharacterTool.js";
import characterImageTool from "../tools/COC/characterImageTool.js";
import triggerSummarizationTool from "../tools/COC/triggerSummarizationTool.js";
import updateCharacterStatsTool from "../tools/COC/updateCharacterStatsTool.js";
import backgroundImageTool from "../tools/COC/backgroundImageTool.js";

const tokenLimit = 10**6;
const triggerLimit = 30000; // 30K
const MAX_TURNS = 5;
const MAX_RETRIES = 5
const INITAIL_DELAY_MS = 1000;
const LLM_NAME = "gemini-2.5-flash";

await configService.loadConfig(true);

const IsCOCSinglePlayOpen = Boolean(configService.get("IsCOCSinglePlayOpen", false));
const COCSinglePlayHasNotCharacterSystemPrompt = configService.get("COCSinglePlayHasNotCharacterSystemPrompt", `你必須嚴格遵循以下的JSON指令塊來扮演CoC KP的角色：
{
  "persona": "專業、友善、高效的CoC TRPG守密人(KP)。",
  "primary_goal": "引導無角色玩家完成創角流程。",
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
      "occupation": "依職業公式計算 (例: 作家=EDU*4, 運動員=EDU*2+STR*2, 根據職業所長為EDU*2+XXX*2)",
      "interest": "INT*2"
    }
  }}`);
const COCSinglePlayHasCharacterSystemPrompt = configService.get("COCSinglePlayHasCharacterSystemPrompt", `{
  "profile": {
    "identity": "專業、友善且高效的《克蘇魯的呼喚》TRPG 守密人 (KP)。",
    "primary_task": "引導玩家完成充滿未知、恐怖和瘋狂的冒險，並根據他們的行動推動劇情。",
    "communication_style": "清晰、簡潔，善於用側面描寫和細節營造懸疑恐怖的氣氛。嚴格遵守《克蘇魯的呼喚》的規則，特別是何時擲骰方面。"
    "response_requirements": "在你的最終回應中，不得包含任何內部的思考、推理或『THOUGHT』區塊。"
  },
  "core_gameplay_loop": [
    "1. 聆聽與澄清：仔細聆聽玩家的行動描述。若描述模糊（如『我用工具』），必須追問細節（『什麼工具？』）以確保行動合理可行。",
    "2. 判斷檢定：根據玩家行動和規則，判斷是否需要能力檢定。若行動極其簡單或必然成功/失敗，則直接進行敘事。",
    "3. 發起檢定或敘事：若需檢定，必須立即呼叫 'rollSingleDice' 工具，並在 'reason' 參數中描述檢定原因（格式：'檢定名稱 (目標值%): 原因'）。若無需檢定，則直接進行敘事。"
  ],
  "rules": {
    "tool_usage": {
      "rollSingleDice": "這是你唯一被允許的擲骰方式，用以確保公平。所有NPC或環境隨機事件均須使用此工具。",
      "secret_rolls": "如需進行暗骰（如心理學），在呼叫 'rollSingleDice' 工具時，在參數中加入 'secret: true'。",
      "generateBackgroundImage": "當角色去到另一個場所的時候，你**必須立即使用**來生成新的場景。增加玩家的沉入感。",
    },
    "system_input_interpretation": {
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
  }}`);
const ThankForTesting = configService.get("ThankForTesting", "Testing time has been ended. Thank you for your testing😆")

const retryMessages = {
  "0": "Brewing a little more coffee... Gemini is giving it another shot! ☕",
  "1": "Hmm, that didn't quite work. Gemini is trying a different angle! 🤔",
  "2": "Whoops, a little turbulence! Rerouting the connection now... ✈️",
  "3": "Just a moment! Gemini is tightening some digital screws... 🔩",
  "4": "It looks like our Gemini KP is facing some stubborn network issues. \nWe've made several attempts to resolve it automatically. \nCould you please try again shortly?🙇‍♀️ \nOur team has been alerted if the issue persists."
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const startPrompt = `Start, please introduce yourself and what the game is?`;

// const systemPrompt = (userLanguage, haveCharacter) => {
//   if (haveCharacter)
//     return `
//                     `;
//   return ` 你必須嚴格遵循以下的JSON指令塊來扮演CoC KP的角色：
// {
//   "persona": "專業、友善、高效的CoC TRPG守密人(KP)。",
//   "primary_goal": "引導無角色玩家完成創角流程。",
//   "decision_flow": {
//     "no_character": "嚴格遵循: 1.熱情歡迎並解釋創角選項(隨機擲骰/點數購買)，詢問偏好。 2.若玩家選'隨機擲骰'並要求代勞，必須立即且唯一地使用'rollCharacterStatus'工具，禁止事前對話，直接呈現JSON結果後再解釋。 3.若玩家選'點數購買'，告知總點數460(範圍15-90)並引導分配。 4.玩家確認完成後，必須使用'saveCharacterStatus'工具儲存。"
//   },
//   "rules": {
//     "tool_usage": {
//       "no_fake_rolls": true,
//       "character_creation": "必須使用 'rollCharacterStatus'",
//       "ingame_checks": "必須使用 'rollSingleDice'"
//     }
//   },
//   "knowledge_base": {
//     "attributes": {
//       "STR": {"roll": "(3d6)*5", "buy_range": "15-90"},
//       "CON": {"roll": "(3d6)*5", "buy_range": "15-90"},
//       "SIZ": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
//       "DEX": {"roll": "(3d6)*5", "buy_range": "15-90"},
//       "APP": {"roll": "(3d6)*5", "buy_range": "15-90"},
//       "INT": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
//       "POW": {"roll": "(3d6)*5", "buy_range": "15-90"},
//       "EDU": {"roll": "(2d6+6)*5", "buy_range": "15-90"},
//       "LUCK": {"roll": "(3d6)*5", "buy_range": "N/A"}
//     },
//     "derived_stats": {
//       "HP": "floor((SIZ+CON)/10)",
//       "MP": "floor(POW/5)",
//       "SAN": "POW"
//     },
//     "skill_points": {
//       "occupation": "依職業公式計算 (例: 作家=EDU*4, 運動員=EDU*2+STR*2, 根據職業所長為EDU*2+XXX*2)",
//       "interest": "INT*2"
//     }
//   }
// }
// `;
// };

const handlerNewCOCChat = async (socket) => {
  console.log("gemini start to run 🤖")
  const userId = socket.user._id;
  const userLanguage = socket.user.language;

  if (!(IsCOCSinglePlayOpen || Boolean(socket.user.isAdmin))) {
    socket.emit("game:created", {
      message: ThankForTesting,
      gameId: "1"
    })
    return;
  }

  try{
    const result = await ai.models.generateContent({
        model: LLM_NAME,
        contents: startPrompt,
        config: { 
          systemInstruction: COCSinglePlayHasNotCharacterSystemPrompt + `please response with ${userLanguage}`,
         }
    })

    const modelResponseText = result.text;

    console.log("Model Response Text: ", modelResponseText);

    const { promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount } = result.usageMetadata;

    console.log(`input_tokens: ${promptTokenCount} | output_tokens: ${candidatesTokenCount} | thoughtsTokenCount: ${thoughtsTokenCount} | totak_tokens: ${totalTokenCount}`)

    const game = await gameHandlers.createGame(userId);
    const gameId = game._id;
    
    await messageModel.create({
      gameId,
      message_type: "model_text_response",
      role: "model",
      content: modelResponseText,
      usage: {
        inputTokens: promptTokenCount,
        outputTokens: candidatesTokenCount + thoughtsTokenCount,
      }
    })

    await gameModel.findByIdAndUpdate(gameId, {
      $inc: {
        "tokenUsage.inputTokens": promptTokenCount,
        "tokenUsage.outputTokens": candidatesTokenCount + thoughtsTokenCount,
        "tokenUsage.totalTokens": totalTokenCount,
      }
    })

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

const handlerUserMessageCOCChat = async (data, user, role) => {
  console.log("Gemini start reading")
  const { gameId, message } = data;
  const userId = user._id;
  const language = user.language;
  if (!message || message.length === 0) {
    io.to(gameId).emit("message:error", { error: { message: "empty input" } })
    return;
  }

  console.log(`!(IsCOCSinglePlayOpen || Boolean(user.isAdmin)): !(${IsCOCSinglePlayOpen} || ${Boolean(user.isAdmin)}) ==> ${!(IsCOCSinglePlayOpen || Boolean(user.isAdmin))}`)

  if (!(IsCOCSinglePlayOpen || Boolean(user.isAdmin))) {
    io.to(gameId).emit("message:received", { message: ThankForTesting, role: "system" });
    return;
  }

  // for testing
  // console.log("gemini got message from user with gameId", gameId);
  // io.to(gameId).emit("message:received", { message: "got your message "+ message, role: "model" });
  // return;
  
  const { messages, character, game } = await gameHandlers.getGameById(
    gameId,
    userId
  );

  const userNewMessage = await messageModel.create({
    gameId,
    message_type: "user_prompt",
    role: "user",
    content: message,
  })

  const newMessgesId = [userNewMessage._id]; // go to delete if gemini fail

  const hasCharacter = character ? true : false;

  try {
    const availableTools = {
      rollSingleDice: rollDiceTool.rollSingleDice,
      // updateGameState: saveGameStateTool.updateGameState
      generateCharacterImage: characterImageTool.generateCharacterImage
    };

    let functionDeclarations = [
      rollDiceTool.rollSingleDiceDeclaration,
      // saveGameStateTool.updateGameStateDeclaration,
      characterImageTool.generateCharacterImageDeclaration,
    ];

    console.log("hasCharacter: ", hasCharacter);

    if (!hasCharacter) {
      availableTools["saveCharacterStatus"] = saveCharacterTool.saveCharacterStatus;
      availableTools["rollCharacterStatus"] = rollDiceTool.rollCharacterStatus;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          rollDiceTool.rollCharacterStatusDeclaration,
          saveCharacterTool.saveCharacterStatusDeclaration,
        ],
      ];
    } else {
      availableTools["updateCharacterStats"] = updateCharacterStatsTool.updateCharacterStats;
      availableTools["generateBackgroundImage"] = backgroundImageTool.generateBackgroundImage;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          updateCharacterStatsTool.updateCharacterStatsDeclaration,
          backgroundImageTool.generateBackgroundImageDeclaration,
        ],
      ];
    }
    // count token-------------------------------------------------
    const historyContents = buildContextForLLM(game, character, messages);

    const latestUserPrompt = { role: "user", parts: [{ text: message }] };

    const contents = [...historyContents, latestUserPrompt]

    // console.log("contents is: ", contents)

    const countTokensResponse = await ai.models.countTokens({
      model: LLM_NAME,
      contents: contents,
    })

    const totalTokens = countTokensResponse.totalTokens;

    console.log("The total token is: ", totalTokens);
    // --------------------------------------------------------------

    if ( totalTokens > tokenLimit ) {
      throw new Error("Content window is too large, aborting request.");
    }

    if (totalTokens > triggerLimit) {
      await triggerSummarizationTool.triggerSummarization(game, messages)
    }

    // retry system
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++){
      console.log(`Gemini API ${attempt + 1} try`);
      try {
        // Gemini agent system
        for (let i = 0; i < MAX_TURNS; i++) {
          console.log("start checking model used function call or not.")
          const result = await ai.models.generateContent({
            model: LLM_NAME,
            contents: contents,
            config: { 
              tools: [{ functionDeclarations }],
              systemInstruction: hasCharacter ? 
              COCSinglePlayHasCharacterSystemPrompt + `please response with ${language}` : 
              COCSinglePlayHasNotCharacterSystemPrompt + `please response with ${language}`,
            }
          })

          const { promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount } = result.usageMetadata;

          const outputTokens = (candidatesTokenCount || 0) + (thoughtsTokenCount || 0);

          console.log(`input_tokens: ${promptTokenCount} | output_tokens: ${outputTokens} | total_tokens: ${totalTokenCount}`);

          // await gameHandlers.addUsedTokenGameById(gameId, usedToken);

          await gameModel.findByIdAndUpdate(gameId, {
            $inc: {
              "tokenUsage.inputTokens": promptTokenCount || 0,
              "tokenUsage.outputTokens": outputTokens,
              "tokenUsage.totalTokens": totalTokenCount || 0,
            }
          })

          if (result.functionCalls && result.functionCalls.length > 0){
            const functionCall = result.functionCalls[0];

            console.log(`functionCall is: ${JSON.stringify(functionCall)}`)

            const { name, args } = functionCall;

            const modelFunctionCallMessage = await messageModel.create({
              gameId,
              message_type: "model_function_call",
              role: "model",
              content: `Gemini use ${name} function`,
              function_call: functionCall,
              usage: {
                inputTokens: promptTokenCount,
                outputTokens: outputTokens,
              }
            })

            io.to(gameId).emit("systemMessage:received", {message: `Gemini use ${name} function`, followingMessage: "Gemini is waiting the result☕"})

            newMessgesId.push(modelFunctionCallMessage._id)


            if (!availableTools[name]) {
              throw new Error("unknown function call: ", name);
            }

            // console.log("model wants to call a function: ", name);
            // console.log("white arguments: ", args);

            args["userId"] = userId;
            args["gameId"] = gameId;
            args["game"] = game;
            args["characterId"] = character?._id || null;

            const { toolResult, functionMessage } = await availableTools[name](args);

            console.log("function execution result: ", toolResult);

            contents.push({
              role: "model",
              parts: [{
                functionCall: functionCall
              }]
            })

            contents.push({
              role: "user",
              parts: [{
                functionResponse: {
                  name,
                  response: toolResult,
                }
              }]
            })

            const functionCallResultMessage = await messageModel.create({
              gameId,
              message_type: "tool_function_result",
              role: "system",
              content: functionMessage,
              function_result: {
                name,
                result: toolResult
              }
            })

            newMessgesId.push(functionCallResultMessage._id)

          } else {
            console.log("model don't have use function call.")
            console.log(`model result:\n${JSON.stringify(result, null, 2)}`)
            const modelResponseText = result.text;
            console.log("Model Resonse Text: ", modelResponseText);

            if (!modelResponseText || modelResponseText.trim() === "" ) {
              console.error("Error ⚠️: Gemini returned an empty response.");
              throw new Error("Gemini returned an empty response");
            }

            console.log("Gemini Response Text is valid, saving messages to DB...")

            const modelResponseMessage = await messageModel.create({
              gameId,
              message_type: "model_text_response",
              role: "model",
              content: modelResponseText,
              usage: {
                inputTokens: promptTokenCount,
                outputTokens: outputTokens,
              }
            })

            newMessgesId.push(modelResponseMessage._id)

            io.to(gameId).emit("message:received", { message: modelResponseText, role: "model" });
            return;
          }
        }
      } catch (error) {
        lastError = error;
        if (error.message.includes("500") || error.message.includes("503")) {
          if (attempt === MAX_RETRIES - 1) {
            console.error("Error ⚠️: Gemini API meet max retries. Stop retry");
            io.to(gameId).emit("message:error", { error: retryMessages[`${attempt}`] })
            throw new Error ("Error ⚠️: Gemini fail to use function call🤦")
          }
          io.to(gameId).emit("systemMessage:received", { message: retryMessages[`${attempt}`], keepLoading: true })

          const delay = INITAIL_DELAY_MS * Math.pow(2, attempt);
          const jitter = Math.random() * 1000;
          const waitTime = delay + jitter;

          console.log(`Gemini API Error in ${attempt + 1} try: Error ⚠️: ${error.message}`);
          console.log(`Retry 🤦 at ${(waitTime / 1000).toFixed(2)} second later`);

          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.log(`Non retry Error ⚠️: ${error.message}`);
          throw error
        }
      }
    }
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    io.to(gameId).emit("message:error", { error: "Error ⚠️: fail to call Gemini API \n If you are trying to ask Gemini to roll a dice, please type '/roll XdY', which X is the number of dice and Y is the number of faces of the dice, to roll dice.", originalMessage: message })
    newMessgesId.forEach((messageId) => messageHandlers.deleteMessage(messageId));
  }
}

export default {
  handlerNewCOCChat,
  handlerUserMessageCOCChat,
};
