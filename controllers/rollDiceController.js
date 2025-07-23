const rollDice = (req, res) => {
  const dice = req.body.dice; // e.g., '2d6', 'd20', '1d10+1', '2d8-2'

  const diceRegex = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$/i;

  const match = dice.replace(/\s/g, "").match(diceRegex);

  if (!match) {
    return res.status(400).send({ message: "Invalid dice format" });
  }

  try {
    const numberOfDice = match[1] ? parseInt(match[1], 10) : 1;

    const sides = parseInt(match[2], 10);

    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    let result = "";
    let total = 0;
    for (let i = 0; i < numberOfDice; i++) {
      const diceResult = Math.floor(Math.random() * sides) + 1;
      result += "+" + diceResult;
      total += diceResult;
    }

    if (modifier !== 0) {
      result += (modifier > 0 ? "+" : "") + modifier;
      total += modifier;
    }

    return res.status(200).send({ message: result.slice(1), total });
  } catch (error) {
    return res.status(400).send({ message: "Invalid dice format" });
  }
};

export default {
  rollDice,
};
