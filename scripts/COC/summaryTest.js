import triggerSummarizationTool from "../../tools/COC/triggerSummarizationTool.js";
import gameModel from "../../models/gameModel.js";
import messageModel from "../../models/messageModel.js";
import COCCharacterModel from "../../models/COCCharacterModel.js";

const summaryTest = async (req, res) => {
    const game = await gameModel.findById("68deedc4804f31f926e07539")
    const messages = await messageModel.find({
          gameId: game._id,
        })
          .sort({ timestamp: 1 })
          .exec();
    const character = await COCCharacterModel.findById(game.characterId);
    const language = "繁體中文";
    await triggerSummarizationTool.triggerSummarization({ game, messages, character, language });
    return res.send({ message: "ok" })
}

export default { summaryTest };