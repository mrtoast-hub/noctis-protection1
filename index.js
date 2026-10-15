
"use strict";

const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  Events,
  REST,
  Routes
} = require("discord.js");

const express = require("express");
const config = require("./config");
const db = require("./database");
const commandModule = require("./commands");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || null;

if (!TOKEN) {
  console.error(
    "[NOCTIS] Missing DISCORD_TOKEN environment variable."
  );
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error(
    "[NOCTIS] Missing CLIENT_ID environment variable."
  );
  process.exit(1);
}

if (
  !commandModule ||
  !Array.isArray(commandModule.commands) ||
  typeof commandModule.handleInteraction !== "function"
) {
  console.error(
    "[NOCTIS] commands.js must export commands and handleInteraction()."
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User
  ]
});

app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.status(200).json({
    name: config.BOT_NAME,
    status: client.isReady() ? "online" : "starting",
    creator: config.CREATOR
  });
});

app.get("/health", (req, res) => {
  const online = client.isReady();

  res.status(online ? 200 : 503).json({
    status: online ? "ok" : "starting",
    bot: config.BOT_NAME,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[WEB] Health server listening on port ${PORT}`);
});

let activityIndex = 0;

const activities = [
  {
    name: "(user)",
    type: ActivityType.Watching
  },
  {
    name: "Protecting Server",
    type: ActivityType.Playing
  }
];

function rotateActivity() {
  if (!client.user) return;

  const activity = activities[activityIndex];

  client.user.setActivity(activity.name, {
    type: activity.type
  });

  activityIndex = (activityIndex + 1) % activities.length;
}

async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const payload = commandModule.commands.map(command => {
    if (typeof command.toJSON === "function") {
      return command.toJSON();
    }

    return command;
  });

  if (payload.length > 100) {
    throw new Error(
      `Found ${payload.length} top-level commands. ` +
      "Discord allows at most 100 per command scope."
    );
  }

  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: payload });

  console.log(
    `[COMMANDS] Registered ${payload.length} slash commands` +
    (GUILD_ID ? ` in guild ${GUILD_ID}.` : " globally.")
  );
}

client.once(Events.ClientReady, async readyClient => {
  console.log("----------------------------------");
  console.log(`${config.BOT_NAME} is online.`);
  console.log(`Logged in as: ${readyClient.user.tag}`);
  console.log(`Creator: ${config.CREATOR}`);
  console.log(`Servers: ${readyClient.guilds.cache.size}`);
  console.log("----------------------------------");

  rotateActivity();

  setInterval(() => {
    rotateActivity();
  }, 30000);

  try {
    await registerSlashCommands();
  } catch (error) {
    console.error(
      "[COMMANDS] Registration failed:",
      error.message
    );
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      await commandModule.handleInteraction(interaction, {
        client,
        config,
        db
      });
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (typeof commandModule.handleSelectMenu === "function") {
        await commandModule.handleSelectMenu(interaction, {
          client,
          config,
          db
        });
      }
      return;
    }

    if (interaction.isButton()) {
      if (typeof commandModule.handleButton === "function") {
        await commandModule.handleButton(interaction, {
          client,
          config,
          db
        });
      }
    }
  } catch (error) {
    console.error("[INTERACTION] Error:", error);

    const response = {
      content: "Something went wrong while running this command.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response).catch(() => {});
    } else if (interaction.isRepliable()) {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.on(Events.GuildCreate, guild => {
  console.log(`[GUILD] Joined ${guild.name} (${guild.id})`);

  try {
    db.getGuild(guild.id);
  } catch (error) {
    console.error("[DATABASE] Guild setup failed:", error.message);
  }
});

client.on(Events.GuildDelete, guild => {
  console.log(`[GUILD] Removed from ${guild.name} (${guild.id})`);
});

client.on(Events.Warn, info => {
  console.warn("[DISCORD WARNING]", info);
});

client.on(Events.Error, error => {
  console.error("[DISCORD CLIENT ERROR]", error);
});

process.on("unhandledRejection", error => {
  console.error("[UNHANDLED REJECTION]", error);
});

process.on("uncaughtException", error => {
  console.error("[UNCAUGHT EXCEPTION]", error);
});

async function shutdown(signal) {
  console.log(`[SYSTEM] Received ${signal}; shutting down.`);

  try {
    client.destroy();

    server.close(() => {
      console.log("[WEB] Health server closed.");
    });
  } catch (error) {
    console.error("[SYSTEM] Shutdown error:", error.message);
  }

  setTimeout(() => process.exit(0), 1000);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

client.login(TOKEN).catch(error => {
  console.error("[LOGIN] Discord login failed:", error.message);
  process.exitCode = 1;
});
