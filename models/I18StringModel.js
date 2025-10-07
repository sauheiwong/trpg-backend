// schemas/I18nStringSchema.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// This sub-schema is for fields that support multiple languages.
// _id is set to false because we don't need a separate ID for this sub-document.
export const I18nStringSchema = new Schema({
    en: { type: String, required: true },
    "zh-TW": { type: String, required: true }
}, { _id: false });