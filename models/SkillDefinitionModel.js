// models/SkillDefinition.js
import mongoose from 'mongoose';
const { Schema } = mongoose;
import { I18nStringSchema } from './I18StringModel.js';

const SkillDefinitionSchema = new Schema({
    // Unique identifier for the skill (e.g., "LISTEN", "SPOT_HIDDEN").
    _id: { type: String, required: true, uppercase: true },
    
    key: { type: I18nStringSchema, required: true },
    baseValue: { type: Number, required: true },
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    editable: { type: Boolean, default: true },
    placeholder: { type: I18nStringSchema, required: true },

    // Specific to skills: recommended occupations for Gemini's search.
    // Adding an index will speed up queries on this field.
    recommendOccupation: { type: [String], index: true }
});

export default mongoose.model('SkillDefinition', SkillDefinitionSchema);