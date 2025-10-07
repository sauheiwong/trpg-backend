// seed.js

import mongoose from 'mongoose';
import AttributeDefinition from './models/AttibuteDefinition.js'; // Adjust the path to your model file
import SkillDefinition from './models/SkillDefinitionModel.js';       // Adjust the path to your model file
import dotenv from "dotenv";
dotenv.config();

// --- 請將這裡換成您的 MongoDB 連線字串 ---
const MONGO_URI = process.env.DB_CONN; 

// A complete list of skills for Call of Cthulhu 7th Edition,
// formatted for the SkillDefinition Mongoose schema.

const allSkills = [
  // ===== Interpersonal Skills =====
  {
    _id: 'CHARM',
    key: { en: 'Charm', 'zh-TW': '魅惑' },
    baseValue: 15,
    minValue: 15,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Charm skill', 'zh-TW': '你的魅惑技能值' },
    recommendOccupation: []
  },
  {
    _id: 'FAST_TALK',
    key: { en: 'Fast Talk', 'zh-TW': '話術' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Fast Talk skill', 'zh-TW': '你的話術技能值' },
    recommendOccupation: []
  },
  {
    _id: 'INTIMIDATE',
    key: { en: 'Intimidate', 'zh-TW': '威嚇' },
    baseValue: 15,
    minValue: 15,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Intimidate skill', 'zh-TW': '你的威嚇技能值' },
    recommendOccupation: []
  },
  {
    _id: 'PERSUADE',
    key: { en: 'Persuade', 'zh-TW': '說服' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Persuade skill', 'zh-TW': '你的說服技能值' },
    recommendOccupation: []
  },

  // ===== Combat Skills =====
  {
    _id: 'FIGHTING_BRAWL',
    key: { en: 'Fighting (Brawl)', 'zh-TW': '鬥毆' },
    baseValue: 25,
    minValue: 25,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Fighting (Brawl) skill', 'zh-TW': '你的鬥毆技能值' },
    recommendOccupation: []
  },
  {
    _id: 'FIREARMS_HANDGUN',
    key: { en: 'Firearms (Handgun)', 'zh-TW': '射擊 (手槍)' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Firearms (Handgun) skill', 'zh-TW': '你的射擊(手槍)技能值' },
    recommendOccupation: []
  },
  {
    _id: 'FIREARMS_RIFLE_SHOTGUN',
    key: { en: 'Firearms (Rifle/Shotgun)', 'zh-TW': '射擊 (步槍/霰彈槍)' },
    baseValue: 25,
    minValue: 25,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Firearms (Rifle/Shotgun) skill', 'zh-TW': '你的射擊(步槍/霰彈槍)技能值' },
    recommendOccupation: []
  },
  {
    _id: 'DODGE',
    key: { en: 'Dodge', 'zh-TW': '閃避' },
    baseValue: 0, // Note: Dodge is half of DEX, baseValue 0 means it must be calculated.
    minValue: 0,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Dodge skill', 'zh-TW': '你的閃避技能值' },
    recommendOccupation: []
  },

  // ===== Knowledge & Academic Skills =====
  {
    _id: 'ACCOUNTING',
    key: { en: 'Accounting', 'zh-TW': '會計' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Accounting skill', 'zh-TW': '你的會計技能值' },
    recommendOccupation: ['會計師', '銀行家']
  },
  {
    _id: 'ANTHROPOLOGY',
    key: { en: 'Anthropology', 'zh-TW': '人類學' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Anthropology skill', 'zh-TW': '你的人類學技能值' },
    recommendOccupation: ['學者', '教授']
  },
  {
    _id: 'ARCHAEOLOGY',
    key: { en: 'Archaeology', 'zh-TW': '考古學' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Archaeology skill', 'zh-TW': '你的考古學技能值' },
    recommendOccupation: ['學者', '教授', '古文物學家']
  },
  {
    _id: 'HISTORY',
    key: { en: 'History', 'zh-TW': '歷史' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your History skill', 'zh-TW': '你的歷史技能值' },
    recommendOccupation: ['學者', '教授', '古文物學家', '記者']
  },
  {
    _id: 'LAW',
    key: { en: 'Law', 'zh-TW': '法律' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Law skill', 'zh-TW': '你的法律技能值' },
    recommendOccupation: ['律師', '偵探', '警察']
  },
  {
    _id: 'LIBRARY_USE',
    key: { en: 'Library Use', 'zh-TW': '圖書館使用' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Library Use skill', 'zh-TW': '你的圖書館使用技能值' },
    recommendOccupation: ['學者', '教授', '記者', '偵探']
  },
  {
    _id: 'MEDICINE',
    key: { en: 'Medicine', 'zh-TW': '醫學' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Medicine skill', 'zh-TW': '你的醫學技能值' },
    recommendOccupation: ['醫生', '護士']
  },
  {
    _id: 'NATURAL_WORLD',
    key: { en: 'Natural World', 'zh-TW': '自然學' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Natural World skill', 'zh-TW': '你的自然學技能值' },
    recommendOccupation: ['生物學家', '農夫']
  },
  {
    _id: 'OCCULT',
    key: { en: 'Occult', 'zh-TW': '神秘學' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Occult skill', 'zh-TW': '你的神秘學技能值' },
    recommendOccupation: ['學者', '作家']
  },
  {
    _id: 'PSYCHOLOGY',
    key: { en: 'Psychology', 'zh-TW': '心理學' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Psychology skill', 'zh-TW': '你的心理學技能值' },
    recommendOccupation: ['心理學家', '醫生', '偵探']
  },
  {
    _id: 'CTHULHU_MYTHOS',
    key: { en: 'Cthulhu Mythos', 'zh-TW': '克蘇魯神話' },
    baseValue: 0,
    minValue: 0,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Cthulhu Mythos skill', 'zh-TW': '你的克蘇魯神話技能值' },
    recommendOccupation: []
  },

  // ===== Perception & Agility Skills =====
  {
    _id: 'APPRAISE',
    key: { en: 'Appraise', 'zh-TW': '估價' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Appraise skill', 'zh-TW': '你的估價技能值' },
    recommendOccupation: ['古文物學家', '藝術家']
  },
  {
    _id: 'FIRST_AID',
    key: { en: 'First Aid', 'zh-TW': '急救' },
    baseValue: 30,
    minValue: 30,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your First Aid skill', 'zh-TW': '你的急救技能值' },
    recommendOccupation: ['醫生', '護士', '警察']
  },
  {
    _id: 'JUMP',
    key: { en: 'Jump', 'zh-TW': '跳躍' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Jump skill', 'zh-TW': '你的跳躍技能值' },
    recommendOccupation: []
  },
  {
    _id: 'LISTEN',
    key: { en: 'Listen', 'zh-TW': '聆聽' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Listen skill', 'zh-TW': '你的聆聽技能值' },
    recommendOccupation: ['偵探', '竊賊']
  },
  {
    _id: 'SPOT_HIDDEN',
    key: { en: 'Spot Hidden', 'zh-TW': '偵查' },
    baseValue: 25,
    minValue: 25,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Spot Hidden skill', 'zh-TW': '你的偵查技能值' },
    recommendOccupation: ['偵探', '警察', '竊賊']
  },
  {
    _id: 'STEALTH',
    key: { en: 'Stealth', 'zh-TW': '潛行' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Stealth skill', 'zh-TW': '你的潛行技能值' },
    recommendOccupation: ['竊賊', '間諜']
  },
  {
    _id: 'SWIM',
    key: { en: 'Swim', 'zh-TW': '游泳' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Swim skill', 'zh-TW': '你的游泳技能值' },
    recommendOccupation: []
  },
  {
    _id: 'THROW',
    key: { en: 'Throw', 'zh-TW': '投擲' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Throw skill', 'zh-TW': '你的投擲技能值' },
    recommendOccupation: []
  },
  {
    _id: 'TRACK',
    key: { en: 'Track', 'zh-TW': '追蹤' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Track skill', 'zh-TW': '你的追蹤技能值' },
    recommendOccupation: ['獵人', '偵探']
  },
  {
    _id: 'CLIMB',
    key: { en: 'Climb', 'zh-TW': '攀爬' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Climb skill', 'zh-TW': '你的攀爬技能值' },
    recommendOccupation: []
  },
  
  // ===== Technical & Craft Skills =====
  {
    _id: 'DRIVE_AUTO',
    key: { en: 'Drive Auto', 'zh-TW': '駕駛 (汽車)' },
    baseValue: 20,
    minValue: 20,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Drive Auto skill', 'zh-TW': '你的駕駛(汽車)技能值' },
    recommendOccupation: []
  },
  {
    _id: 'ELECTRICAL_REPAIR',
    key: { en: 'Electrical Repair', 'zh-TW': '電器維修' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Electrical Repair skill', 'zh-TW': '你的電器維修技能值' },
    recommendOccupation: ['工程師']
  },
  {
    _id: 'LOCKSMITH',
    key: { en: 'Locksmith', 'zh-TW': '鎖匠' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Locksmith skill', 'zh-TW': '你的鎖匠技能值' },
    recommendOccupation: ['竊賊']
  },
  {
    _id: 'MECHANICAL_REPAIR',
    key: { en: 'Mechanical Repair', 'zh-TW': '機械維修' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Mechanical Repair skill', 'zh-TW': '你的機械維修技能值' },
    recommendOccupation: ['工程師', '機械師']
  },
  {
    _id: 'NAVIGATE',
    key: { en: 'Navigate', 'zh-TW': '導航' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Navigate skill', 'zh-TW': '你的導航技能值' },
    recommendOccupation: ['飛行員', '水手']
  },
  {
    _id: 'OPERATE_HEAVY_MACHINERY',
    key: { en: 'Operate Heavy Machinery', 'zh-TW': '操作重機' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Operate Heavy Machinery skill', 'zh-TW': '你的操作重機技能值' },
    recommendOccupation: ['工人', '工程師']
  },
  {
    _id: 'PSYCHOANALYSIS',
    key: { en: 'Psychoanalysis', 'zh-TW': '精神分析' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Psychoanalysis skill', 'zh-TW': '你的精神分析技能值' },
    recommendOccupation: ['心理學家', '醫生']
  },
  {
    _id: 'RIDE',
    key: { en: 'Ride', 'zh-TW': '騎術' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Ride skill', 'zh-TW': '你的騎術技能值' },
    recommendOccupation: []
  },
  {
    _id: 'SLEIGHT_OF_HAND',
    key: { en: 'Sleight of Hand', 'zh-TW': '手藝' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Sleight of Hand skill', 'zh-TW': '你的手藝技能值' },
    recommendOccupation: ['魔術師', '竊賊']
  },
  {
    _id: 'SURVIVAL',
    key: { en: 'Survival', 'zh-TW': '生存' },
    baseValue: 10,
    minValue: 10,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Survival skill', 'zh-TW': '你的生存技能值' },
    recommendOccupation: ['獵人', '士兵']
  },
  {
    _id: 'DISGUISE',
    key: { en: 'Disguise', 'zh-TW': '喬裝' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Disguise skill', 'zh-TW': '你的喬裝技能值' },
    recommendOccupation: ['間諜', '演員']
  },
  
  // ===== Categorical Skills (requiring specialization) =====
  {
    _id: 'ART_CRAFT',
    key: { en: 'Art/Craft', 'zh-TW': '藝術/手藝' },
    baseValue: 5,
    minValue: 5,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Art/Craft skill', 'zh-TW': '你的藝術/手藝技能值' },
    recommendOccupation: ['藝術家']
  },
  {
    _id: 'SCIENCE',
    key: { en: 'Science', 'zh-TW': '科學' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Science skill', 'zh-TW': '你的科學技能值' },
    recommendOccupation: ['學者', '科學家']
  },
  {
    _id: 'LANGUAGE_OTHER',
    key: { en: 'Language (Other)', 'zh-TW': '外語' },
    baseValue: 1,
    minValue: 1,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Other Language skill', 'zh-TW': '你的外語技能值' },
    recommendOccupation: []
  },
  
  // ===== Special Skill =====
  {
    _id: 'CREDIT_RATING',
    key: { en: 'Credit Rating', 'zh-TW': '信譽' },
    baseValue: 0,
    minValue: 0,
    maxValue: 99,
    editable: true,
    placeholder: { en: 'Your Credit Rating', 'zh-TW': '你的信譽' },
    recommendOccupation: []
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // Clear existing data (optional, but good for re-running the script)
    console.log('Clearing old data...');
    await AttributeDefinition.deleteMany({});
    await SkillDefinition.deleteMany({});

    // Create new attribute definitions
    console.log('Creating attribute definitions...');
    await AttributeDefinition.create([
      {
        _id: 'STR',
        key: { en: 'Strength', 'zh-TW': '力量' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your STR', 'zh-TW': '你的力量值' },
      },
      {
        _id: 'CON',
        key: { en: 'Constitution', 'zh-TW': '體質' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your CON', 'zh-TW': '你的體質值' },
      },
      {
        _id: 'SIZ',
        key: { en: 'Size', 'zh-TW': '體型' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your SIZ', 'zh-TW': '你的體型值' },
      },
      {
        _id: 'DEX',
        key: { en: 'Dexterity', 'zh-TW': '敏捷' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your DEX', 'zh-TW': '你的敏捷值' },
      },
      {
        _id: 'APP',
        key: { en: 'Appearance', 'zh-TW': '外貌' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your APP', 'zh-TW': '你的外貌值' },
      },
      {
        _id: 'EDU',
        key: { en: 'Education', 'zh-TW': '教育' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your EDU', 'zh-TW': '你的教育值' },
      },
      {
        _id: 'INT',
        key: { en: 'Intelligence', 'zh-TW': '智力' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your INT', 'zh-TW': '你的智力值' },
      },
      {
        _id: 'POW',
        key: { en: 'Power', 'zh-TW': '意志' },
        baseValue: 15,
        minValue: 15,
        maxValue: 90,
        editable: true,
        placeholder: { en: 'Your POW', 'zh-TW': '你的意志值' },
      }
    ]);
    console.log('Attributes created.');

    // // Create new skill definitions
    // console.log('Creating skill definitions...');
    // await SkillDefinition.create(allSkills);
    // console.log('Skills created.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

// Run the seeding function
seedDatabase();