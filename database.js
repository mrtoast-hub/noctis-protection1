
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function createDefaultDatabase() {
  return {
    guilds: {},
    users: {},
    warnings: {},
    tickets: {},
    partnerships: {},
    invites: {},
    economy: {},
    securityLogs: {},
    cases: {},
    reminders: {},
    polls: {},
    giveaways: {},
    suggestions: {},
    automod: {},
    tempActions: {}
  };
}

let database = createDefaultDatabase();

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function save() {
  try {
    ensureDataDirectory();

    const temporaryFile = `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(database, null, 2),
      "utf8"
    );

    fs.renameSync(temporaryFile, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[DATABASE] Save failed:", error.message);
    return false;
  }
}

function load() {
  try {
    ensureDataDirectory();

    if (!fs.existsSync(DATA_FILE)) {
      database = createDefaultDatabase();
      save();
      return;
    }

    const fileContents = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(fileContents);

    database = {
      ...createDefaultDatabase(),
      ...parsed
    };

    console.log("[DATABASE] Loaded successfully.");
  } catch (error) {
    console.error("[DATABASE] Load failed:", error.message);
    console.error(
      "[DATABASE] Check data/store.json before restarting."
    );

    // Keep the process running without overwriting a potentially
    // recoverable database file.
    database = createDefaultDatabase();
  }
}

function getGuild(guildId) {
  if (!guildId) {
    throw new Error("A guild ID is required.");
  }

  if (!database.guilds[guildId]) {
    database.guilds[guildId] = {
      ...config.DEFAULT_SETTINGS,
      prefix: config.PREFIX,
      disabledCommands: [],
      ignoredChannels: [],
      createdAt: Date.now()
    };

    save();
  }

  return database.guilds[guildId];
}

function updateGuild(guildId, changes) {
  const guild = getGuild(guildId);

  Object.assign(guild, changes);
  save();

  return guild;
}

function getUser(userId) {
  if (!userId) {
    throw new Error("A user key is required.");
  }

  if (!database.users[userId]) {
    database.users[userId] = {
      xp: 0,
      level: 0,
      coins: config.ECONOMY.startingCoins,
      lastMessageAt: 0,
      lastDaily: 0,
      lastWork: 0,
      lastCrime: 0,
      lastGamble: 0,
      inventory: [],
      createdAt: Date.now()
    };

    save();
  }

  return database.users[userId];
}

function updateUser(userId, changes) {
  const user = getUser(userId);

  Object.assign(user, changes);
  save();

  return user;
}

function getCollection(name) {
  if (
    !Object.prototype.hasOwnProperty.call(database, name) ||
    name === "__proto__" ||
    name === "constructor"
  ) {
    throw new Error(`Unknown database collection: ${name}`);
  }

  return database[name];
}

function setRecord(collection, key, value) {
  const records = getCollection(collection);

  records[key] = value;
  save();

  return value;
}

function getRecord(collection, key) {
  const records = getCollection(collection);
  return records[key] ?? null;
}

function deleteRecord(collection, key) {
  const records = getCollection(collection);

  if (!Object.prototype.hasOwnProperty.call(records, key)) {
    return false;
  }

  delete records[key];
  save();

  return true;
}

function getAllGuilds() {
  return database.guilds;
}

function getGuildUsers(guildId) {
  const prefix = `${guildId}:`;

  return Object.entries(database.users)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => ({
      userId: key.slice(prefix.length),
      ...value
    }));
}

function addCoins(userId, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Coin amount must be a non-negative integer.");
  }

  const user = getUser(userId);
  user.coins = Math.max(0, Number(user.coins) || 0) + amount;

  save();
  return user.coins;
}

function removeCoins(userId, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Coin amount must be a non-negative integer.");
  }

  const user = getUser(userId);
  const currentCoins = Math.max(0, Number(user.coins) || 0);

  if (currentCoins < amount) {
    return false;
  }

  user.coins = currentCoins - amount;
  save();

  return true;
}

function incrementRecord(collection, key, field, amount = 1) {
  if (!Number.isFinite(amount)) {
    throw new Error("Increment amount must be a finite number.");
  }

  const records = getCollection(collection);
  const record = records[key] || {};

  record[field] = (Number(record[field]) || 0) + amount;
  records[key] = record;

  save();
  return record[field];
}

load();

module.exports = {
  load,
  save,
  getGuild,
  updateGuild,
  getUser,
  updateUser,
  getCollection,
  setRecord,
  getRecord,
  deleteRecord,
  getAllGuilds,
  getGuildUsers,
  addCoins,
  removeCoins,
  incrementRecord
};
      
