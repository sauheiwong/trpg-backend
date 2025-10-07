import { io } from "../app.js";
import rollDiceTool from "../tools/COC/rollDiceTool.js";

import AttributeDefinitionSchema from "../models/AttibuteDefinition.js"

const characterUpdate = (req, res) => {
    const gameId = req.params.id;
    io.to(gameId).emit("newCharacter:received", { newCharacter: null })
    return res.status(200).send({ message: "ok"});
}

const modalTest = async(req, res) => {
    const gameId = req.params.id;
    const languages_code = req.user.language ? req.user.language.trim() : "en";

    const allAttributes = await AttributeDefinitionSchema.find({}).lean();

    const items = {
        "LUCK": {
            key: "LUCK",
            value: rollDiceTool.rollDice("(3d6)*5").result,
            keyboardType: "numeric",
            editable: false,
            placeholder: "Your LUCK",
        },
    }

    allAttributes.forEach((element) => {
        items[element._id] = {
            key: element.key[languages_code],
            value: element.baseValue,
            minValue: element.minValue,
            maxValue: element.maxValue,
            editable: element.editable,
            placeholder: element.placeholder[languages_code]
        }
    });


    const formData = {
        title: "Allocate Your Point",
        point: {
            "name": "Attribute Pt.",
            "value": 460,
        },
        items
    }
    io.to(gameId).emit("formAvailable:received", { formData })
    return res.status(200).send({ message: "ok"});
}

export default {
    characterUpdate,
    modalTest,
}