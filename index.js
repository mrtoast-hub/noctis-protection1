
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");
const express = require("express");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID environment variable.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

const app = express();

app.get("/", (_req, res) => {
  res.status(200).send("NOCTIS PROTECTION is running.");
});

app.get("/health", (_req, res) => {
  res.json({
    name: "NOCTIS PROTECTION",
    status: client.isReady() ? "online" : "starting",
    uptime: process.uptime()
  });
});

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available NOCTIS commands"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot response time"),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Show bot information"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show information about this server"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a member")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member to inspect")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a member's avatar")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member whose avatar you want")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete recent messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of messages (1–100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName("user").setDescription("Member to kick").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the kick")
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("user").setDescription("Member to ban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the ban")
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Temporarily restrict a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("user").setDescription("Member to timeout").setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutes")
        .setDescription("Duration in minutes (1–40320)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for the timeout")
    )
].map(command => command.toJSON());

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
  client.user.setActivity("your server | /help");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("NOCTIS PROTECTION")
        .setDescription("Available commands")
        .addFields(
          { name: "General", value: "`/help` `/ping` `/botinfo` `/serverinfo` `/userinfo` `/avatar`" },
          { name: "Moderation", value: "`/clear` `/kick` `/ban` `/timeout`" }
        )
        .setFooter({ text: "NOCTIS PROTECTION • Security & moderation" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === "ping") {
      return interaction.reply(
        `Pong! API latency: ${client.ws.ping}ms`
      );
    }

    if (commandName === "botinfo") {
      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Bot Information")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: "Name", value: client.user.tag, inline: true },
          { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
          { name: "Uptime", value: `${Math.floor(process.uptime())} seconds`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "serverinfo") {
      if (!interaction.guild) {
        return interaction.reply({ content: "Use this command in a server.", ephemeral: true });
      }

      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: "Server ID", value: guild.id }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "userinfo") {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = interaction.guild
        ? await interaction.guild.members.fetch(user.id).catch(() => null)
        : null;

      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle(`User Information: ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "Username", value: user.tag, inline: true },
          { name: "User ID", value: user.id },
          { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` }
        );

      if (member) {
        embed.addFields({
          name: "Joined Server",
          value: member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : "Unknown"
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "avatar") {
      const user = interaction.options.getUser("user") || interaction.user;
      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 1024 }));

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "clear") {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "Use this command in a server.", ephemeral: true });
      }

      if (!interaction.channel || !interaction.channel.isTextBased() || !interaction.channel.bulkDelete) {
        return interaction.reply({ content: "This channel does not support bulk deletion.", ephemeral: true });
      }

      const amount = interaction.options.getInteger("amount", true);
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `Deleted ${deleted.size} recent message(s). Messages older than 14 days cannot be bulk-deleted.`,
        ephemeral: true
      });
    }

    if (commandName === "kick" || commandName === "ban") {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "Use this command in a server.", ephemeral: true });
      }

      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || `Action by ${interaction.user.tag}`;

      if (user.id === interaction.user.id) {
        return interaction.reply({ content: "You cannot moderate yourself.", ephemeral: true });
      }

      if (user.id === client.user.id) {
        return interaction.reply({ content: "I cannot moderate myself.", ephemeral: true });
      }

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "That member is not in this server.", ephemeral: true });
      }

      if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) !== true &&
          member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          content: "Your highest role must be above the target member's highest role.",
          ephemeral: true
        });
      }

      if (commandName === "kick") {
        await member.kick(reason);
        return interaction.reply({ content: `Kicked **${user.tag}**. Reason: ${reason}` });
      }

      await interaction.guild.members.ban(user.id, { reason });
      return interaction.reply({ content: `Banned **${user.tag}**. Reason: ${reason}` });
    }

    if (commandName === "timeout") {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "Use this command in a server.", ephemeral: true });
      }

      const user = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") || `Action by ${interaction.user.tag}`;

      if (user.id === interaction.user.id || user.id === client.user.id) {
        return interaction.reply({ content: "Choose another member.", ephemeral: true });
      }

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "That member is not in this server.", ephemeral: true });
      }

      if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) !== true &&
          member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          content: "Your highest role must be above the target member's highest role.",
          ephemeral: true
        });
      }

      await member.timeout(minutes * 60 * 1000, reason);
      return interaction.reply({
        content: `Timed out **${user.tag}** for ${minutes} minute(s). Reason: ${reason}`
      });
    }
  } catch (error) {
    console.error(`Command ${commandName} failed:`, error);

    const reply = {
      content: "The command failed. Check my permissions, role position, and host logs.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(reply).catch(() => {});
    }

    return interaction.reply(reply).catch(() => {});
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
                 
