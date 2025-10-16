import rollDiceTool from "../tools/COC/rollDiceTool.js";

const rollDiceController = async(req, res) => {
  const dice = req.body.dice; // e.g., '2d6', 'd20', '1d10+1', '2d8-2'
  console.log(`dice string is: ${dice}`)

  try {
    const { message } = rollDiceTool.rollDice(dice);

    return res.status(200).send({ message });
    
  } catch (error) {
    return res.status(400).send({ message: "Invalid dice format" });
  }
};

export default {
  rollDiceController,
};
