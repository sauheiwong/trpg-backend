import { io } from "../app.js";

const characterUpdate = (req, res) => {
    const gameId = req.params.id;
    io.to(gameId).emit("newCharacter:received", { newCharacter: null })
    return res.status(200).send({ message: "ok"});
}

export default {
    characterUpdate,
}