import mongoose from "mongoose";

const Schema = mongoose.Schema;

const characterSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  name: { type: String, required: true, trim: true, default: "New Character" },
  class: { type: String },
  level: { type: Number, default: 1 },
  hp: { type: Number, required: true },
  mp: { type: Number, required: true },
  san: { type: Number, required: true },
  attributes: {
    type: Map,
    of: Number,
  },
  skills: {
    type: Map,
    of: Number,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  description: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  imageUrl: { type: String, default: "" },
});

characterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

characterSchema.index({ userId: 1 });

export default mongoose.model("COCCharacter", characterSchema);
