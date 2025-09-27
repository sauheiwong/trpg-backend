// services/config.service.js
import AppSetting from "../models/AppSettingModel.js"

// Cache configuration to avoid frequent DB calls.
let configCache = null;
let lastFetched = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache for 5 minutes

/**
 * Fetches all settings from the database and populates the cache.
 * @param {boolean} force - If true, forces a refetch from the database.
 */
async function loadConfig(force = false) {
    const now = Date.now();
    // Use cache if it's not expired, unless a force refresh is requested.
    if (!force && configCache && lastFetched && (now - lastFetched < CACHE_TTL_MS)) {
        console.log('Loading configuration from cache.');
        return;
    }

    try {
        console.log('Fetching configuration from database...');
        const settings = await AppSetting.find({});
        
        // Transform the array of settings into a key-value map for easy access.
        const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});

        configCache = settingsMap;
        lastFetched = now;
        console.log('Configuration loaded and cached successfully.');
    } catch (error) {
        console.error('Failed to load configuration from database:', error);
        // If loading fails, we might want to throw an error to stop the app
        // or fall back to some default values.
        throw new Error('Could not load application configuration.');
    }
}

/**
 * Gets a configuration value by its key.
 * @param {string} key - The key of the setting to retrieve.
 * @param {*} defaultValue - The default value to return if the key is not found.
 * @returns {*} The value of the setting.
 */
function get(key, defaultValue = undefined) {
    if (!configCache) {
        console.error('Configuration cache is not initialized. Call loadConfig() first.');
        // You might want to return a default value or throw an error here.
        return defaultValue;
    }
    return configCache[key] !== undefined ? configCache[key] : defaultValue;
}

export default {
    loadConfig,
    get,
    // You could also expose the entire cache if needed, but 'get' is safer.
    // getAll: () => ({ ...configCache }) 
};