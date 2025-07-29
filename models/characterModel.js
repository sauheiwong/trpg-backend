import mongoose from "mongoose";

const Schema = mongoose.Schema;

const skillSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    dice: String,
    target: String,
    duration: String,
    effectType: String,
  },
  { _id: false }
);

const characterSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  name: { type: String, required: true, trim: true, default: "New Character" },
  class: { type: String },
  level: { type: Number, default: 1 },
  hp: {
    max: Number,
    current: Number,
  },
  MP: {
    max: Number,
    current: Number,
  },
  attributes: {
    type: Map,
    of: Number,
  },
  skills: {
    type: Map,
    of: skillSchema,
  },
  equipment: [
    {
      name: { type: String, required: true },
      quantity: {
        type: Number,
        default: 1,
      },
      damage: {
        type: String,
      },
      equipped: {
        type: Boolean,
        default: false,
      },
      description: String,
    },
  ],
  customAttributes: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isCompleted: { type: Boolean, default: false },
});

characterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

characterSchema.index({ userId: 1 });

export default mongoose.model("character", characterSchema);
