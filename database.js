
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

const defaultDatabase = () => ({
  guilds: {},
  users: {},
  invites: {},
  tickets: {},
  partnerships: {},
  warnings: {},
  economy: {}
});

let database = defaultDatabase();

function load() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });

    if (fs.existsSync(dataFile)) {
      const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      database = {
        ...defaultDatabase(),
        ...parsed
      };
    } else {
      save();
    }
  } catch (error) {
    console.error("Database load failed:", error.message);
    database = defaultDatabase();
  }
}

function save() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });

    const tempFile = `${dataFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(database, null, 2));
    fs.renameSync(tempFile, dataFile);
  } catch (error) {
    console.error("Database save failed:", error.message);
  }
}

function getGuild(guildId) {
  if (!database.guilds[guildId]) {
    database.guilds[guildId] = {
      ...config.DEFAULT_SETTINGS,
      prefix: config.PREFIXES[0],
      levels: {},
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
  if (!database.users[userId]) {
    database.users[userId] = {
      xp: 0,
      level: 0,
      coins: 0,
      lastDaily: 0,
      lastMessageAt: 0
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
  if (!Object.prototype.hasOwnProperty.call(database, name)) {
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

function deleteRecord(collection, key) {
  const records = getCollection(collection);
  const existed = Object.prototype.hasOwnProperty.call(records, key);

  if (existed) {
    delete records[key];
    save();
  }

  return existed;
}

function getAllGuilds() {
  return database.guilds;
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
  deleteRecord,
  getAllGuilds
};
                        
