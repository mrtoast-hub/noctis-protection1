
"use strict";

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

function makeEmbed(title, description, color = 0xffffff) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Open the NOCTIS command center"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot response latency"),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("View bot information"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("View this server's information"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View a member's information")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member to inspect")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Display a member's avatar")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member whose avatar you want")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("noctis_pfp")
    .setDescription("Display a user's profile picture")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Choose a user")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("noctis_banner")
    .setDescription("Display a user's Discord profile banner")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Choose a user")
        .setRequired(false)
    )
].map(command => command.toJSON());

const helpCategories = {
  Home: [
    "`/help` — Open command center",
    "`/ping` — Check latency",
    "`/botinfo` — Bot information",
    "`/serverinfo` — Server information"
  ],

  Moderation: [
    "Moderation commands will be added in a later part.",
    "Examples planned: kick, ban, timeout, warn, purge."
  ],

  Utility: [
    "`/userinfo` — Member information",
    "`/avatar` — Display avatar",
    "`/noctis_pfp` — Display profile picture",
    "`/noctis_banner` — Display profile banner"
  ],

  Gambling: [
    "Virtual-coin commands will be added in a later part.",
    "No real-money gambling."
  ],

  Economy: [
    "Virtual economy commands will be added in a later part.",
    "Planned: balance, daily, work, shop, inventory."
  ],

  Partnership: [
    "Partnership tickets and ad confirmation will be added in a later part."
  ],

  System: [
    "Defensive security tools will be added in a later part.",
    "Planned: security logs, anti-spam, anti-raid settings."
  ]
};

function buildHelpMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("noctis_help_category")
    .setPlaceholder("Select a command category")
    .addOptions(
      Object.keys(helpCategories).map(category => ({
        label: category,
        value: category,
        description: `View ${category} commands`
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

async function handleInteraction(interaction, context) {
  const { client, config } = context;
  const { commandName } = interaction;

  if (commandName === "help") {
    const embed = makeEmbed(
      `${config.BOT_NAME} | Command Center`,
      [
        "Welcome to the NOCTIS command center.",
        "",
        "**Select a category below** to browse commands.",
        "",
        `**Prefix:** \`${config.PREFIX}\``,
        `**Creator:** ${config.CREATOR}`,
        `[Twitch](${config.TWITCH_URL})`
      ].join("\n")
    );

    return interaction.reply({
      embeds: [embed],
      components: [buildHelpMenu()]
    });
  }

  if (commandName === "ping") {
    const embed = makeEmbed(
      "Pong!",
      [
        `**WebSocket:** ${client.ws.ping} ms`,
        `**Uptime:** ${Math.floor(process.uptime())} seconds`
      ].join("\n")
    );

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "botinfo") {
    const embed = makeEmbed(
      config.BOT_NAME,
      [
        `**Creator:** ${config.CREATOR}`,
        `**Servers:** ${client.guilds.cache.size}`,
        `**Users cached:** ${client.users.cache.size}`,
        `**Discord.js:** ${require("discord.js").version}`,
        `**Node.js:** ${process.version}`,
        `[Twitch Channel](${config.TWITCH_URL})`
      ].join("\n")
    );

    if (client.user) {
      embed.setThumbnail(client.user.displayAvatarURL());
    }

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "serverinfo") {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: "This command must be used inside a server.",
        ephemeral: true
      });
    }

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = makeEmbed(
      guild.name,
      [
        `**Server ID:** ${guild.id}`,
        `**Owner:** ${owner ? owner.user.tag : "Unavailable"}`,
        `**Members:** ${guild.memberCount}`,
        `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
        `**Verification:** ${guild.verificationLevel}`
      ].join("\n")
    );

    if (guild.iconURL()) {
      embed.setThumbnail(guild.iconURL({ size: 256 }));
    }

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "userinfo") {
    const target =
      interaction.options.getUser("user") || interaction.user;

    const member = interaction.guild
      ? await interaction.guild.members
          .fetch(target.id)
          .catch(() => null)
      : null;

    const embed = makeEmbed(
      `User Information: ${target.username}`,
      [
        `**Username:** ${target.tag}`,
        `**User ID:** ${target.id}`,
        `**Bot account:** ${target.bot ? "Yes" : "No"}`,
        `**Account created:** <t:${Math.floor(target.createdTimestamp / 1000)}:F>`,
        `**Joined server:** ${
          member?.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : "Unavailable"
        }`
      ].join("\n")
    ).setThumbnail(target.displayAvatarURL({ size: 256 }));

    return interaction.reply({ embeds: [embed] });
  }

  if (
    commandName === "avatar" ||
    commandName === "noctis_pfp"
  ) {
    const target =
      interaction.options.getUser("user") || interaction.user;

    const avatar = target.displayAvatarURL({
      size: 1024,
      extension: "png"
    });

    const embed = makeEmbed(
      `${target.username}'s Avatar`,
      `[Open full-size avatar](${avatar})`
    ).setImage(avatar);

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "noctis_banner") {
    const selected =
      interaction.options.getUser("user") || interaction.user;

    const target = await client.users
      .fetch(selected.id, { force: true })
      .catch(() => null);

    if (!target) {
      return interaction.reply({
        content: "I couldn't retrieve that user's profile.",
        ephemeral: true
      });
    }

    const banner = target.bannerURL({
      size: 1024,
      extension: "png"
    });

    if (!banner) {
      return interaction.reply({
        content: "That user doesn't have a visible Discord banner.",
        ephemeral: true
      });
    }

    const embed = makeEmbed(
      `${target.username}'s Banner`,
      `[Open full-size banner](${banner})`
    ).setImage(banner);

    return interaction.reply({ embeds: [embed] });
  }

  return interaction.reply({
    content: "This command hasn't been implemented yet.",
    ephemeral: true
  });
}

async function handleSelectMenu(interaction) {
  if (interaction.customId !== "noctis_help_category") {
    return;
  }

  const category = interaction.values[0];
  const description = helpCategories[category];

  if (!description) {
    return interaction.reply({
      content: "Unknown help category.",
      ephemeral: true
    });
  }

  const embed = makeEmbed(
    `NOCTIS | ${category}`,
    description.join("\n")
  );

  return interaction.update({
    embeds: [embed],
    components: [buildHelpMenu()]
  });
}

module.exports = {
  commands,
  handleInteraction,
  handleSelectMenu
};
    
