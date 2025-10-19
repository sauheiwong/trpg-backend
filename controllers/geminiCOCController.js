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
import allocatePointTool from "../tools/COC/allocatePointTool.js";
import skillPointTool from "../tools/COC/skillPointTool.js";

const tokenLimit = 4*10**4; // 40,000
const MAX_TURNS = 5;
const MAX_RETRIES = 5
const INITAIL_DELAY_MS = 1000;
const LLM_NAME = "gemini-2.5-flash-preview-09-2025";

await configService.loadConfig(true);

const IsCOCSinglePlayOpen = Boolean(configService.get("IsCOCSinglePlayOpen", false));
const COCSinglePlayHasNotCharacterSystemPrompt = configService.get("COCSinglePlayHasNotCharacterSystemPrompt", `{
  "profile": {
    "role": "專業、友善、高效的 CoC 守密人 (KP)。",
    "task": "引導新玩家完成角色創建流程。"
  },
  "character_creation_workflow": [
    "1. 歡迎玩家，提供屬性生成選項：「隨機擲骰」或「點數購買」。",
    "2. 若選「隨機擲骰」：立即使用 "rollCharacterStatus()" 工具。必須先展示工具回傳的結果，之後才可進行對話解釋。",
    "3. 若選「點數購買」：立即使用 "allocateCharacterPoint()" 工具。玩家填的資料是加到那個數值。",
    "4. 屬性確定後：依序詢問故事的「時代」與「地點」，然後才詢問角色的「職業」。",
    "5. 解說技能點：分為與職業高度相關的「職業技能點」，以及自由選擇的「興趣技能點」。",
    "6.  屬性、職業、背景齊備後：禁止直接向玩家展示技能列表或計算點數。你必須在內部自行判斷該職業的技能列表及其基礎值，計算總點數，然後立即用這些資訊呼叫 allocateSkillPoint 工具。",
    "7. 玩家最終確認角色無誤後：使用 "saveCharacterStatus()" 工具儲存資料。"
  ],
  "rules": {
    "tools": "必須嚴格依照 workflow 中指定的時機使用指定工具，禁止虛構任何擲骰或計算結果。"
  },
  "reference_data": {
    "attributes": {
      "STR": {"dice": "(3d6)*5", "range": "15-90"}, "CON": {"dice": "(3d6)*5", "range": "15-90"}, "SIZ": {"dice": "(2d6+6)*5", "range": "15-90"}, "DEX": {"dice": "(3d6)*5", "range": "15-90"},
      "APP": {"dice": "(3d6)*5", "range": "15-90"}, "INT": {"dice": "(2d6+6)*5", "range": "15-90"}, "POW": {"dice": "(3d6)*5", "range": "15-90"}, "EDU": {"dice": "(2d6+6)*5", "range": "15-90"},
      "LUCK": "(3d6)*5"
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
  }
}`); 
const COCSinglePlayHasCharacterSystemPrompt = configService.get("COCSinglePlayHasCharacterSystemPrompt", `{
  "profile": {
    "identity": "專業、友善且高效的《克蘇魯的呼喚》TRPG 守密人 (KP)。",
    "primary_task": "引導玩家體驗未知、恐怖與瘋狂的冒險，並根據其行動推動劇情。",
    "style": "溝通清晰簡潔，善於用間接描寫和感官細節營造懸疑氛圍。嚴格遵守 CoC 規則，特別是擲骰時機。"
  },
  "narrative_principles": {
    "pacing_flow": "劇情應遵循「常態 -> 怪異 -> 衝擊 -> 最終恐怖」的節奏。常態與怪異交替出現，衝擊較少，最終恐怖為高潮。",
    "phase_details": {
      "常態": "建立日常感，給予玩家掌控感與安全感。",
      "怪異": "製造懸疑。事件可被理性解釋，但隱含超自然暗示（如：瘋子的話、異常的痕跡）。",
      "衝擊": "無可辯駁的恐怖，打破常規，動搖角色的世界觀（如：怪物一瞥、極端暴力）。",
      "最終恐怖": "真相的直接揭露。作為故事高潮，旨在逼瘋、擊潰或驅逐角色。"
    },
    "atmosphere": "恐怖源於未知。絕不直稱神話生物之名。利用環境、感官細節和異常現象營造氣氛。",
    "scene_management": {
      "常態/怪異": "保持被動，緩慢揭示信息。先給場景大概印象，讓玩家主動調查。根據玩家行動，以多感官細節回應。利用擲骰解鎖更多線索，而非終結調查。讓玩家自行串連和詮釋線索。",
      "衝擊/最終恐怖": "轉為主動，聚焦於恐懼本身，減少環境細節描述。模糊、曖昧的恐怖比清晰的描述更有效。"
    }
  },
  "gameplay_loop": [
    "1. 澄清玩家行動：若玩家描述模糊（如「我搜查房間」），追問具體方式與位置。",
    "2. 判斷檢定：決定行動是否需要擲骰。若極其簡單或不可能，則直接敘事。",
    "3. 發起檢定：若需檢定，【立即】呼叫 'rollSingleDice' 工具，並在 'reason' 中說明（格式：'檢定 (目標%)：原因'）。【呼叫工具前不加任何描述】。",
    "4. 描述結果：【收到工具結果後】，才開始撰寫劇情描述。"
  ],
  "rules": {
    "response_format": {
      "header": "回覆的【第一行】必須是結果標頭：'【<技能>檢定：<結果>/<目標值> -> <成敗級別>】'。",
      "narrative": "【換行後】撰寫劇情。將結果融入故事，【不要】在敘述中重複「成功/失敗」或具體數值。",
      "outcomes": {
        "大成功 (1-5)": "給予意想不到的額外正面效果。",
        "成功": "描述行動成功。",
        "失敗": "描述行動失敗與後果。",
        "大失敗 (96-100)": "觸發更糟的負面後果。"
      }
    },
    "tool_usage": {
      "rollSingleDice": "這是所有擲骰（玩家、NPC、環境）的【唯一】方式，確保公平。若需暗骰(例如: 心理學)，加入參數 'secret: true'。",
      "generateBackgroundImage": "當角色抵達新的場景、故事一開始或者沒有背景圖時，【必須立即使用】。",
      "san_check": "當角色遭遇超自然或衝擊性真相時觸發。擲 1D100 對抗當前 SAN 值。成功則損失較少理智（如 1/1D4），失敗則損失較多（如 1D4/1D10）。若檢定失敗，可短暫控制角色描述其瘋狂或幻覺。"
    },
    "player_agency": "嚴守玩家代理權，絕不替玩家角色（PL）做決定。你控制所有非玩家角色（NPC）及其動機。"
  },
  "final_instruction": "在你的最終回應中，不得包含任何內部的思考、推理或『THOUGHT』區塊。"
}`);
const ThankForTesting = configService.get("ThankForTesting", "Testing time has been ended. Thank you for your testing😆")
const triggerLimit = configService.get("triggerLimit", 12000); // 12K


const retryMessages = {
  "0": "Brewing a little more coffee... Gemini is giving it another shot! ☕",
  "1": "Hmm, that didn't quite work. Gemini is trying a different angle! 🤔",
  "2": "Whoops, a little turbulence! Rerouting the connection now... ✈️",
  "3": "Just a moment! Gemini is tightening some digital screws... 🔩",
  "4": "It looks like our Gemini KP is facing some stubborn network issues. \nWe've made several attempts to resolve it automatically. \nCould you please try again shortly?🙇‍♀️ \nOur team has been alerted if the issue persists."
}

const language_code = {
  "en": "English",
  "zh-Hant": "繁體中文",
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const startPrompt = `Start, please introduce yourself and what the game is?`;

const handlerNewCOCChat = async (socket) => {
  console.log("gemini start to run 🤖")
  const userId = socket.user._id;
  const userLanguage = language_code[socket.user.language] || language_code["en"];

  if (!(IsCOCSinglePlayOpen || Boolean(socket.user.isAdmin) || Boolean(socket.user.isTester))) {
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

    const tokenUsage = {
      inputTokens: promptTokenCount ?? 0,
      outputTokens: (candidatesTokenCount ?? 0) + (thoughtsTokenCount ?? 0),
      totalTokens: totalTokenCount ?? 0,
    }

    const game = await gameHandlers.createGame(userId);
    const gameId = game._id;
    
    await messageModel.create({
      gameId,
      message_type: "model_text_response",
      role: "model",
      content: modelResponseText,
      usage: {
        inputTokens: tokenUsage.inputTokens,
        outputTokens: tokenUsage.outputTokens,
      }
    })

    await gameModel.findByIdAndUpdate(gameId, {
      $inc: {
        "tokenUsage.inputTokens": tokenUsage.inputTokens,
        "tokenUsage.outputTokens": tokenUsage.outputTokens,
        "tokenUsage.totalTokens": tokenUsage.totalTokens,
      }
    })

    socket.emit("game:created", {
      message: modelResponseText,
      gameId: gameId,
      tokenUsage,
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
  const language = language_code[user.language] || language_code["en"];
  if (!message || message.length === 0) {
    io.to(gameId).emit("message:error", { error: "empty input" })
    return;
  }

  console.log(`!(IsCOCSinglePlayOpen || Boolean(user.isAdmin)): !(${IsCOCSinglePlayOpen} || ${Boolean(user.isAdmin)}) ==> ${!(IsCOCSinglePlayOpen || Boolean(user.isAdmin))}`)

  if (!(IsCOCSinglePlayOpen || Boolean(user.isAdmin) || Boolean(user.isTester))) {
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

    if (hasCharacter) {
      availableTools["updateCharacterStats"] = updateCharacterStatsTool.updateCharacterStats;
      availableTools["generateBackgroundImage"] = backgroundImageTool.generateBackgroundImage;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          updateCharacterStatsTool.updateCharacterStatsDeclaration,
          backgroundImageTool.generateBackgroundImageDeclaration,
        ],
      ];
    } else {
      availableTools["saveCharacterStatus"] = saveCharacterTool.saveCharacterStatus;
      availableTools["allocateCharacterPoint"] = allocatePointTool.allocateCharacterPoint;
      availableTools["rollCharacterStatus"] = rollDiceTool.rollCharacterStatus;
      availableTools["allocateSkillPoint"] = skillPointTool.allocateSkillPoint;
      functionDeclarations = [
        ...functionDeclarations,
        ...[
          rollDiceTool.rollCharacterStatusDeclaration,
          saveCharacterTool.saveCharacterStatusDeclaration,
          allocatePointTool.allocateCharacterPointDeclaration,
          skillPointTool.allocateSkillPointDeclaration,
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

    console.log("The total token before processing is: ", totalTokens);
    // --------------------------------------------------------------

    if ( totalTokens > tokenLimit ) {
      throw new Error("Content window is too large, aborting request.");
    }

    let totalInputToken = 0;

    const existBackgroundImages = Object.keys(game.backgroundImages).map((item) => item)

    // retry system
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++){
      console.log(`Gemini API ${attempt + 1} try`);
      console.log(`current background: ${game.currentBackgroundImage.name} | all background: ${existBackgroundImages.length !== 0 ? existBackgroundImages : "null"}`)
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
              COCSinglePlayHasCharacterSystemPrompt + `please generate all response, **including function call args**, with **${language}**\n已經生成好的埸景:${ existBackgroundImages.length !== 0 ? existBackgroundImages : "null"}\n現在的場景是${game.currentBackgroundImage.name || "null"}`: 
              COCSinglePlayHasNotCharacterSystemPrompt + `please generate all response, **including function call args**, with **${language}**`,
            }
          })

          console.log(`result.candidates: ${JSON.stringify(result.candidates, null, 2)}`)

          const { promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount } = result.usageMetadata;
          
          const tokenUsage = {
            inputTokens: promptTokenCount ?? 0,
            outputTokens: (candidatesTokenCount ?? 0) + (thoughtsTokenCount ?? 0),
            totalTokens: totalTokenCount ?? 0,
          }

          console.log(`input_tokens: ${tokenUsage.inputTokens} | output_tokens: ${tokenUsage.outputTokens} | total_tokens: ${tokenUsage.totalTokens}`);

          if(result.candidates[0]?.finishReason === "MALFORMED_FUNCTION_CALL" || tokenUsage.outputTokens === 0){
            throw new Error("MALFORMED_FUNCTION_CALL")
          }
          
          await gameModel.findByIdAndUpdate(gameId, {
            $inc: {
              "tokenUsage.inputTokens": tokenUsage.inputTokens,
              "tokenUsage.outputTokens": tokenUsage.outputTokens,
              "tokenUsage.totalTokens": tokenUsage.totalTokens,
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
                inputTokens: tokenUsage.inputTokens,
                outputTokens: tokenUsage.outputTokens,
              }
            })

            io.to(gameId).emit("system:message", {message: `Gemini use ${name} function`, followingMessage: "Gemini is waiting the result☕", tokenUsage})

            newMessgesId.push(modelFunctionCallMessage._id)

            if (!availableTools[name]) {
              throw new Error("unknown function call: ", name);
            }

            args["userId"] = userId;
            args["gameId"] = gameId;
            args["game"] = game;
            args["characterId"] = character?._id || null;
            args["language_code"] = user.language

            const { toolResult, functionMessage } = await availableTools[name](args);

            console.log("function execution result: ", JSON.stringify(toolResult, null, 2));

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
            const modelResponseTextPart = result.candidates[0].content?.parts;
            let modelResponseText = null;
            if (modelResponseTextPart.length > 1) {
              modelResponseText = modelResponseTextPart[1].text;
            } else {
              modelResponseText = modelResponseTextPart[0].text;
            }

            if (!modelResponseText || modelResponseText.trim() === "" ) {
              console.error("Error ⚠️: Gemini returned an empty response.");
              throw new Error("Gemini returned an empty response");
            }

            console.log("Gemini Response Text is valid, saving messages to DB...")

            totalInputToken = tokenUsage.inputTokens;

            const modelResponseMessage = await messageModel.create({
              gameId,
              message_type: "model_text_response",
              role: "model",
              content: modelResponseText,
              usage: {
                inputTokens: tokenUsage.inputTokens,
                outputTokens: tokenUsage.outputTokens,
              }
            })

            newMessgesId.push(modelResponseMessage._id)

            io.to(gameId).emit("message:received", { message: modelResponseText, role: "model", tokenUsage });
            break;
          }
        }
      } catch (error) {
        console.log(`Error ⚠️: ${error}`);
        lastError = error;
        if (error.message.includes("500") || error.message.includes("503") || error.message.includes("MALFORMED_FUNCTION_CALL")) {
          if (attempt === MAX_RETRIES - 1) {
            console.error("Error ⚠️: Gemini API meet max retries. Stop retry");
            io.to(gameId).emit("message:error", { error: retryMessages[`${attempt}`], message: "model fail to generate function call args" })
            throw new Error ("Error ⚠️: Gemini fail to use function call🤦")
          }
          io.to(gameId).emit("system:message", { message: retryMessages[`${attempt}`], keepLoading: true })

          const delay = INITAIL_DELAY_MS * Math.pow(2, attempt);
          const jitter = Math.random() * 1000;
          const waitTime = delay + jitter;

          console.log(`Gemini API Error in ${attempt + 1} try: Error ⚠️: ${error.message}`);
          console.log(`Retry 🤦 at ${(waitTime / 1000).toFixed(2)} second later`);

          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.log(`Non retry Error ⚠️:\n${JSON.stringify(error, null, 2)}`);
          throw error
        }
      }
    console.log(`totalInputToken: ${totalInputToken}`);
    if (totalInputToken > triggerLimit) {
      await triggerSummarizationTool.triggerSummarization({game, gameId, messages, character, language})
    }
    return;
    }
  } catch (error) {
    console.error("Error ⚠️: fail to call Gemini API: ", error);
    io.to(gameId).emit("message:error", { error: "Error ⚠️: fail to call Gemini API \n Please click the reload button on side bar and try it again", originalMessage: message })
    newMessgesId.forEach((messageId) => messageHandlers.deleteMessage(messageId));
  }
}

export default {
  handlerNewCOCChat,
  handlerUserMessageCOCChat,
};
