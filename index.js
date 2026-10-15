
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ActivityType
} = require("discord.js");

const express = require("express");
const config = require("./config");
const db = require("./database");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();

app.get("/", (_req, res) => {
  res.send("NOCTIS PROTECTION is running.");
});

app.get("/health", (_req, res) => {
  res.json({
    bot: config.BOT_NAME,
    status: client.isReady() ? "online" : "starting",
    uptime: Math.floor(process.uptime())
  });
});

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Open the NOCTIS command menu"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency"),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("View bot information"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("View this server's information"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View a member's information")
    .addUserOption(o =>
      o.setName("user").setDescription("Choose a member")
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("View a user's avatar")
    .addUserOption(o =>
      o.setName("user").setDescription("Choose a user")
    ),

  new SlashCommandBuilder()
    .setName("noctis_pfp")
    .setDescription("View a user's profile picture")
    .addUserOption(o =>
      o.setName("user").setDescription("Choose a user")
    ),

  new SlashCommandBuilder()
    .setName("noctis_banner")
    .setDescription("View a user's Discord banner")
    .addUserOption(o =>
      o.setName("user").setDescription("Choose a user")
    ),

  new SlashCommandBuilder()
    .setName("welcome-set")
    .setDescription("Configure the welcome message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Welcome channel")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message")
        .setDescription("Use {user}, {username}, {server}, {membercount}")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("welcome-toggle")
    .setDescription("Enable or disable welcome messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addBooleanOption(o =>
      o.setName("enabled")
        .setDescription("Enable welcome messages?")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("leave-set")
    .setDescription("Configure the leave message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Leave channel")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message")
        .setDescription("Use {user}, {username}, {server}, {membercount}")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("leave-toggle")
    .setDescription("Enable or disable leave messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addBooleanOption(o =>
      o.setName("enabled")
        .setDescription("Enable leave messages?")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("level-notifications")
    .setDescription("Configure level-up notifications")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Notification channel")
        .setRequired(true)
    )
    .addBooleanOption(o =>
      o.setName("enabled")
        .setDescription("Enable notifications?")
        .setRequired(true)
    )
].map(command => command.toJSON());

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.COLORS.primary)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: config.BOT_NAME });
}

function fillTemplate(template, member) {
  return template
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{membercount}", String(member.guild.memberCount));
}

const helpPages = {
  Home: "Welcome to NOCTIS PROTECTION.\nChoose a category below to browse commands.",
  Moderation: "`/clear` `/kick` `/ban` `/timeout`\nMore moderation commands will be added next.",
  Utility: "`/ping` `/botinfo` `/serverinfo` `/userinfo` `/avatar` `/noctis_pfp` `/noctis_banner`",
  Gambling: "Virtual-coin games will be added here. No real-money betting.",
  Economy: "Virtual balance, daily rewards, and XP features are planned here.",
  Partnership: "Ticket panels, ad confirmation, and staff assistance are planned here.",
  System: "Defensive antinuke, raid protection, and security logs will be configured here."
};

function helpMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("noctis_help_category")
    .setPlaceholder("Select a command category")
    .addOptions(
      config.CATEGORIES.map(category => ({
        label: category,
        value: category,
        description: `${category} commands`
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`Registered ${commands.length} slash commands.`);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  const activities = [
    { name: "(user)", type: ActivityType.Watching },
    { name: "Protecting Server", type: ActivityType.Playing }
  ];

  let activityIndex = 0;

  const rotateActivity = () => {
    const activity = activities[activityIndex];
    client.user.setActivity(activity.name, { type: activity.type });
    activityIndex = (activityIndex + 1) % activities.length;
  };

  rotateActivity();
  setInterval(rotateActivity, 30000);

  console.log("NOCTIS PROTECTION is ready.");
});

client.on("guildMemberAdd", async member => {
  try {
    const settings = db.getGuild(member.guild.id);

    if (settings.welcomeEnabled && settings.welcomeChannelId) {
      const channel = await member.guild.channels
        .fetch(settings.welcomeChannelId)
        .catch(() => null);

      if (channel && channel.isTextBased()) {
        await channel.send({
          content: fillTemplate(settings.welcomeMessage, member)
        });
      }
    }
  } catch (error) {
    console.error("Welcome event error:", error.message);
  }
});

client.on("guildMemberRemove", async member => {
  try {
    const settings = db.getGuild(member.guild.id);

    if (settings.leaveEnabled && settings.leaveChannelId) {
      const channel = await member.guild.channels
        .fetch(settings.leaveChannelId)
        .catch(() => null);

      if (channel && channel.isTextBased()) {
        await channel.send({
          content: fillTemplate(settings.leaveMessage, member)
        });
      }
    }
  } catch (error) {
    console.error("Leave event error:", error.message);
  }
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  if (content === "nhelp" || content === "!help") {
    return message.reply({
      embeds: [
        makeEmbed(
          "NOCTIS PROTECTION",
          "Use `/help` for the interactive command menu."
        )
      ]
    }).catch(() => {});
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "noctis_help_category") return;

      const category = interaction.values[0];

      return interaction.update({
        embeds: [
          makeEmbed(category, helpPages[category] || "No commands listed yet.")
        ],
        components: [helpMenu()]
      });
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === "help") {
      return interaction.reply({
        embeds: [makeEmbed("NOCTIS PROTECTION", helpPages.Home)],
        components: [helpMenu()],
        ephemeral: true
      });
    }

    if (commandName === "ping") {
      return interaction.reply({
        embeds: [
          makeEmbed("Pong!", `WebSocket latency: ${client.ws.ping} ms`)
        ]
      });
    }

    if (commandName === "botinfo") {
      const embed = makeEmbed(
        "Bot Information",
        `**Name:** ${client.user.tag}\n**Servers:** ${client.guilds.cache.size}\n**Uptime:** ${Math.floor(process.uptime())} seconds`
      ).setThumbnail(client.user.displayAvatarURL());

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "serverinfo") {
      if (!interaction.guild) {
        return interaction.reply({
          content: "Use this command in a server.",
          ephemeral: true
        });
      }

      const guild = interaction.guild;
      const embed = makeEmbed(
        guild.name,
        `**Members:** ${guild.memberCount}\n**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n**Server ID:** ${guild.id}`
      );

      if (guild.iconURL()) embed.setThumbnail(guild.iconURL());

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "userinfo") {
      const user = interaction.options.getUser("user") || interaction.user;
      const embed = makeEmbed(
        `User Information: ${user.username}`,
        `**Username:** ${user.tag}\n**User ID:** ${user.id}\n**Account created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
      ).setThumbnail(user.displayAvatarURL({ size: 1024 }));

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "avatar" || commandName === "noctis_pfp") {
      const user = interaction.options.getUser("user") || interaction.user;

      const embed = makeEmbed(
        `${user.username}'s Profile Picture`,
        `[Open full-size image](${user.displayAvatarURL({ size: 1024 })})`
      ).setImage(user.displayAvatarURL({ size: 1024 }));

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "noctis_banner") {
      const user = interaction.options.getUser("user") || interaction.user;
      const fetched = await client.users.fetch(user.id, { force: true });

      if (!fetched.banner) {
        return interaction.reply({
          content: "This user has no accessible Discord profile banner.",
          ephemeral: true
        });
      }

      const url = fetched.bannerURL({ size: 1024 });

      return interaction.reply({
        embeds: [
          makeEmbed(`${user.username}'s Banner`, `[Open full-size banner](${url})`)
            .setImage(url)
        ]
      });
    }

    if (commandName === "welcome-set") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message", true);

      db.updateGuild(interaction.guildId, {
        welcomeChannelId: channel.id,
        welcomeMessage: message
      });

      return interaction.reply({
        content: "Welcome settings saved. Use `/welcome-toggle enabled:true` to turn them on.",
        ephemeral: true
      });
    }

    if (commandName === "welcome-toggle") {
      const enabled = interaction.options.getBoolean("enabled", true);

      db.updateGuild(interaction.guildId, { welcomeEnabled: enabled });

      return interaction.reply({
        content: `Welcome messages are now ${enabled ? "enabled" : "disabled"}.`,
        ephemeral: true
      });
    }

    if (commandName === "leave-set") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message", true);

      db.updateGuild(interaction.guildId, {
        leaveChannelId: channel.id,
        leaveMessage: message
      });

      return interaction.reply({
        content: "Leave settings saved. Use `/leave-toggle enabled:true` to turn them on.",
        ephemeral: true
      });
    }

    if (commandName === "leave-toggle") {
      const enabled = interaction.options.getBoolean("enabled", true);

      db.updateGuild(interaction.guildId, { leaveEnabled: enabled });

      return interaction.reply({
        content: `Leave messages are now ${enabled ? "enabled" : "disabled"}.`,
        ephemeral: true
      });
    }

    if (commandName === "level-notifications") {
      const channel = interaction.options.getChannel("channel", true);
      const enabled = interaction.options.getBoolean("enabled", true);

      db.updateGuild(interaction.guildId, {
        levelChannelId: channel.id,
        levelNotificationsEnabled: enabled
      });

      return interaction.reply({
        content: `Level notification settings saved. Status: ${enabled ? "enabled" : "disabled"}.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Interaction error:", error);

    const response = {
      content: "Something went wrong. Check the bot permissions and host logs.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(response).catch(() => {});
    }

    if (interaction.isRepliable()) {
      return interaction.reply(response).catch(() => {});
    }
  }
});

async function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Health server listening on port ${PORT}`);
  });

  await registerCommands();
  await client.login(TOKEN);
}

start().catch(error => {
  console.error("Startup failed:", error);
  process.exit(1);
});
  
