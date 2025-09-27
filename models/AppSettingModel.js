import mongoose from "mongoose";

const Schema = mongoose.Schema;

const appSettingSchema = new Schema({
     key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Use Mixed type to allow any data type
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['string', 'boolean', 'number', 'json'],
        default: 'string'
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt
})

export default mongoose.model('AppSetting', appSettingSchema, 'app_settings');