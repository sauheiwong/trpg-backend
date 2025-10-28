import triggerSummarizationTool from "../../tools/COC/triggerSummarizationTool.js";
import { buildContextForLLM } from "../../tools/COC/buildContextForLLMTool.js";
import gameModel from "../../models/gameModel.js";
import messageModel from "../../models/messageModel.js";
import COCCharacterModel from "../../models/COCCharacterModel.js";

const summaryTest = async (req, res) => {
  const gameId = "68deedc4804f31f926e07539";
  const game = await gameModel.findById(gameId);
  const messages = await messageModel
    .find({
      gameId: game._id,
    })
    .sort({ timestamp: 1 })
    .exec();
  const character = await COCCharacterModel.findById(game.characterId);
  const language = "繁體中文";
  await triggerSummarizationTool.triggerSummarization({
    game,
    gameId,
    messages,
    character,
    language,
  });
  return res.send({ message: "ok" });
};

const buildContextTest = async (req, res) => {
  const gameId = "68deedc4804f31f926e07539";
  const game = await gameModel.findById(gameId);
  const messages = await messageModel
    .find({
      gameId: game._id,
    })
    .sort({ timestamp: 1 })
    .exec();
  const character = await COCCharacterModel.findById(game.characterId);
  const language = "繁體中文";
  const context = await buildContextForLLM(game, gameId, character, messages);
  console.log(`context is\n${JSON.stringify(context, null, 2)}`);
  return res.send({ message: "ok" });
};

export default { summaryTest, buildContextTest };
