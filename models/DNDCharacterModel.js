// backend/models/DNDCharacterModel.js

import mongoose from "mongoose";

const DNDCharacterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
  name: { type: String, required: true },
  race: { type: String, required: true },
  class: { type: String, required: true },
  level: { type: Number, default: 1 },
  background: { type: String },
  alignment: { type: String },

  hp: {
    max: { type: Number, required: true },
    current: { type: Number, required: true },
  },

  armorClass: { type: Number, required: true },
  speed: { type: Number, required: true },
  proficiencyBonus: { type: Number, required: true },

  // 儲存屬性分數和調整值
  attributes: {
    type: Map,
    of: new mongoose.Schema({
      score: { type: Number },
      modifier: { type: Number },
    }),
  },

  // 儲存角色熟練的豁免檢定
  savingThrows: {
    type: Map,
    of: { proficient: { type: Boolean, default: false } },
  },

  // 儲存角色熟練的技能
  skills: {
    type: Map,
    of: { proficient: { type: Boolean, default: false } },
  },

  equipment: [
    {
      name: { type: String },
      quantity: { type: Number, default: 1 },
      description: { type: String },
    },
  ],

  featuresAndTraits: [
    {
      name: { type: String },
      description: { type: String },
    },
  ],

  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DNDCharacter", DNDCharacterSchema);