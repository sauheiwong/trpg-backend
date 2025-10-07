// models/AttributeDefinition.js
import mongoose from 'mongoose';
const { Schema } = mongoose;
import { I18nStringSchema } from './I18StringModel.js';

const AttributeDefinitionSchema = new Schema({
    // Using a human-readable, unique string like "STR" as the document's ID (_id).
    // This is the field you will query against.
    _id: { type: String, required: true, uppercase: true },
    
    // The display name in multiple languages.
    key: { type: I18nStringSchema, required: true },

    // The base value for the attribute. Stored as a Number in the DB.
    baseValue: { type: Number, required: true },
    
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    editable: { type: Boolean, default: true },
    
    // The placeholder text in multiple languages.
    placeholder: { type: I18nStringSchema, required: true },
});

export default mongoose.model('AttributeDefinition', AttributeDefinitionSchema);