
"use strict";

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

function makeEmbed(title, description, color = 0xffffff) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function isAllowed(interaction, permission) {
  return Boolean(interaction.memberPermissions?.has(permission));
}

function denied(interaction) {
  return interaction.reply({
    content: "You don't have permission to use this command.",
    ephemeral: true
  });
}

function getWarnings(db, guildId, userId) {
  const key = `${guildId}:${userId}`;
  const value = db.getRecord("warnings", key);
  return Array.isArray(value) ? value : [];
}

function createCommand(name, description) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);
}

const commands = [
  createCommand("help", "Open the NOCTIS command center"),
  createCommand("ping", "Check bot response latency"),
  createCommand("botinfo", "View bot information"),
  createCommand("serverinfo", "View server information"),

  createCommand("userinfo", "View member information")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Member to inspect")
        .setRequired(false)
    ),

  createCommand("avatar", "Display a member's avatar")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Member whose avatar you want")
        .setRequired(false)
    ),

  createCommand("noctis_pfp", "Display a user's profile picture")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Choose a user")
        .setRequired(false)
    ),

  createCommand("noctis_banner", "Display a user's profile banner")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Choose a user")
        .setRequired(false)
    ),

  createCommand("kick", "Kick a member from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to kick").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)
    ),

  createCommand("ban", "Ban a member from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to ban").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)
    ),

  createCommand("timeout", "Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to timeout").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Duration in minutes (1–40320)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)
    ),

  createCommand("untimeout", "Remove a member's timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to untimeout").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)
    ),

  createCommand("warn", "Record a moderation warning")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to warn").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Warning reason").setRequired(true)
    ),

  createCommand("warnings", "View a member's warning history")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to check").setRequired(true)
    ),

  createCommand("clearwarnings", "Clear a member's warning history")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Member to clear").setRequired(true)
    ),

  createCommand("purge", "Delete recent messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Number of messages (1–100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  createCommand("lock", "Prevent members from sending messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  createCommand("unlock", "Allow members to send messages again")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  createCommand("slowmode", "Set channel slowmode")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName("seconds")
        .setDescription("Slowmode duration (0–21600)")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    ),

  createCommand("nick", "Change a member's server nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(o =>
      o.setName("user").setDescription("Member").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("nickname")
        .setDescription("New nickname; use reset to remove it")
        .setRequired(true)
    )
].map(command => command.toJSON());

const helpCategories = {
  Home: [
    "`/help` — Command center",
    "`/ping` — Check latency",
    "`/botinfo` — Bot information",
    "`/serverinfo` — Server information"
  ],
  Moderation: [
    "`/kick` — Kick a member",
    "`/ban` — Ban a member",
    "`/timeout` — Apply timeout",
    "`/untimeout` — Remove timeout",
    "`/warn` — Record a warning",
    "`/warnings` — View warnings",
    "`/clearwarnings` — Clear warnings",
    "`/purge` — Delete messages",
    "`/lock` and `/unlock` — Channel access",
    "`/slowmode` — Configure slowmode",
    "`/nick` — Change nickname"
  ],
  Utility: [
    "`/userinfo` — Member information",
    "`/avatar` — Display avatar",
    "`/noctis_pfp` — Profile picture",
    "`/noctis_banner` — Profile banner"
  ],
  Gambling: [
    "Virtual-coin commands are planned for a later part."
  ],
  Economy: [
    "Economy commands are planned for a later part."
  ],
  Partnership: [
    "Partnership ticket commands are planned for a later part."
  ],
  System: [
    "Defensive security tools are planned for a later part."
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
  const { client, config, db } = context;
  const { commandName } = interaction;

  if (commandName === "help") {
    return interaction.reply({
      embeds: [
        makeEmbed(
          `${config.BOT_NAME} | Command Center`,
          [
            "Welcome to the NOCTIS command center.",
            "",
            "**Select a category below** to browse commands.",
            `**Prefix:** \`${config.PREFIX}\``,
            `**Creator:** ${config.CREATOR}`,
            `[Twitch](${config.TWITCH_URL})`
          ].join("\n")
        )
      ],
      components: [buildHelpMenu()]
    });
  }

  if (commandName === "ping") {
    return interaction.reply({
      embeds: [
        makeEmbed(
          "Pong!",
          `**WebSocket:** ${client.ws.ping} ms\n**Uptime:** ${Math.floor(process.uptime())} seconds`
        )
      ]
    });
  }

  if (commandName === "botinfo") {
    const embed = makeEmbed(
      config.BOT_NAME,
      [
        `**Creator:** ${config.CREATOR}`,
        `**Servers:** ${client.guilds.cache.size}`,
        `**Cached users:** ${client.users.cache.size}`,
        `**Discord.js:** ${require("discord.js").version}`,
        `**Node.js:** ${process.version}`,
        `[Twitch Channel](${config.TWITCH_URL})`
      ].join("\n")
    );

    if (client.user) embed.setThumbnail(client.user.displayAvatarURL());

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "serverinfo") {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: "Use this command inside a server.",
        ephemeral: true
      });
    }

    const owner = await guild.fetchOwner().catch(() => null);
    const embed = makeEmbed(
      guild.name,
      [
        `**Server ID:** ${guild.id}`,
        `**Owner:** ${owner?.user.tag || "Unavailable"}`,
        `**Members:** ${guild.memberCount}`,
        `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`
      ].join("\n")
    );

    if (guild.iconURL()) embed.setThumbnail(guild.iconURL());

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "userinfo") {
    const target = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild
      ? await interaction.guild.members.fetch(target.id).catch(() => null)
      : null;

    const embed = makeEmbed(
      `User Information: ${target.username}`,
      [
        `**Username:** ${target.tag}`,
        `**ID:** ${target.id}`,
        `**Bot:** ${target.bot ? "Yes" : "No"}`,
        `**Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:F>`,
        `**Joined:** ${member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unavailable"}`
      ].join("\n")
    ).setThumbnail(target.displayAvatarURL());

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "avatar" || commandName === "noctis_pfp") {
    const target = interaction.options.getUser("user") || interaction.user;
    const url = target.displayAvatarURL({ size: 1024, extension: "png" });

    return interaction.reply({
      embeds: [
        makeEmbed(`${target.username}'s Avatar`, `[Open full-size image](${url})`)
          .setImage(url)
      ]
    });
  }

  if (commandName === "noctis_banner") {
    const selected = interaction.options.getUser("user") || interaction.user;
    const target = await client.users.fetch(selected.id, { force: true })
      .catch(() => null);

    if (!target) {
      return interaction.reply({
        content: "Couldn't retrieve that user's profile.",
        ephemeral: true
      });
    }

    const banner = target.bannerURL({ size: 1024, extension: "png" });

    if (!banner) {
      return interaction.reply({
        content: "That user doesn't have a visible profile banner.",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        makeEmbed(`${target.username}'s Banner`, `[Open full-size image](${banner})`)
          .setImage(banner)
      ]
    });
  }

  if (!interaction.inGuild()) {
    return interaction.reply({
      content: "This command must be used inside a server.",
      ephemeral: true
    });
  }

  const guild = interaction.guild;
  const botMember = guild.members.me;
  const reason = interaction.options.getString("reason") || "No reason provided.";

  if (commandName === "kick") {
    if (!isAllowed(interaction, PermissionFlagsBits.KickMembers)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: "I need the Kick Members permission.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: "I cannot kick this member. Check role hierarchy and bot permissions.", ephemeral: true });

    await member.kick(reason);

    return interaction.reply({
      embeds: [makeEmbed("Member Kicked", `**Member:** ${user.tag}\n**Reason:** ${reason}`)]
    });
  }

  if (commandName === "ban") {
    if (!isAllowed(interaction, PermissionFlagsBits.BanMembers)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: "I need the Ban Members permission.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ content: "I cannot ban this member. Check role hierarchy.", ephemeral: true });
    }

    await guild.members.ban(user.id, { reason });

    return interaction.reply({
      embeds: [makeEmbed("Member Banned", `**Member:** ${user.tag}\n**Reason:** ${reason}`)]
    });
  }

  if (commandName === "timeout") {
    if (!isAllowed(interaction, PermissionFlagsBits.ModerateMembers)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: "I need the Moderate Members permission.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const minutes = interaction.options.getInteger("minutes");
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "I cannot timeout this member. Check role hierarchy.", ephemeral: true });

    await member.timeout(minutes * 60 * 1000, reason);

    return interaction.reply({
      embeds: [makeEmbed("Timeout Applied", `**Member:** ${user.tag}\n**Duration:** ${minutes} minutes\n**Reason:** ${reason}`)]
    });
  }

  if (commandName === "untimeout") {
    if (!isAllowed(interaction, PermissionFlagsBits.ModerateMembers)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: "I need the Moderate Members permission.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "I cannot modify this member's timeout.", ephemeral: true });

    await member.timeout(null, reason);

    return interaction.reply({
      embeds: [makeEmbed("Timeout Removed", `Removed timeout for **${user.tag}**.`)]
    });
  }

  if (commandName === "warn") {
    if (!isAllowed(interaction, PermissionFlagsBits.ModerateMembers)) return denied(interaction);

    const user = interaction.options.getUser("user");
    const warningReason = interaction.options.getString("reason");
    const key = `${guild.id}:${user.id}`;
    const warnings = getWarnings(db, guild.id, user.id);

    warnings.push({
      moderatorId: interaction.user.id,
      reason: warningReason,
      timestamp: Date.now()
    });

    db.setRecord("warnings", key, warnings);

    return interaction.reply({
      embeds: [
        makeEmbed(
          "Warning Recorded",
          `**Member:** ${user.tag}\n**Reason:** ${warningReason}\n**Total warnings:** ${warnings.length}`
        )
      ]
    });
  }

  if (commandName === "warnings") {
    if (!isAllowed(interaction, PermissionFlagsBits.ModerateMembers)) return denied(interaction);

    const user = interaction.options.getUser("user");
    const warnings = getWarnings(db, guild.id, user.id);

    const description = warnings.length
      ? warnings.slice(-10).map((warning, index) =>
          `**${index + 1}.** ${warning.reason}\nModerator: <@${warning.moderatorId}> · <t:${Math.floor(warning.timestamp / 1000)}:R>`
        ).join("\n\n")
      : "This member has no recorded warnings.";

    return interaction.reply({
      embeds: [makeEmbed(`Warnings: ${user.tag}`, description)],
      ephemeral: true
    });
  }

  if (commandName === "clearwarnings") {
    if (!isAllowed(interaction, PermissionFlagsBits.ModerateMembers)) return denied(interaction);

    const user = interaction.options.getUser("user");
    db.deleteRecord("warnings", `${guild.id}:${user.id}`);

    return interaction.reply({
      content: `Cleared recorded warnings for ${user.tag}.`,
      ephemeral: true
    });
  }

  if (commandName === "purge") {
    if (!isAllowed(interaction, PermissionFlagsBits.ManageMessages)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: "I need the Manage Messages permission.", ephemeral: true });
    }

    const amount = interaction.options.getInteger("amount");

    if (!interaction.channel?.isTextBased() || !interaction.channel.bulkDelete) {
      return interaction.reply({ content: "This channel doesn't support bulk deletion.", ephemeral: true });
    }

    const deleted = await interaction.channel.bulkDelete(amount, true);

    return interaction.reply({
      content: `Deleted ${deleted.size} recent message(s). Messages older than 14 days cannot be bulk-deleted.`,
      ephemeral: true
    });
  }

  if (commandName === "lock" || commandName === "unlock") {
    if (!isAllowed(interaction, PermissionFlagsBits.ManageChannels)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "I need the Manage Channels permission.", ephemeral: true });
    }

    const channel = interaction.channel;
    const everyoneRole = guild.roles.everyone;

    if (!channel || !channel.permissionOverwrites) {
      return interaction.reply({ content: "This channel cannot be locked by this command.", ephemeral: true });
    }

    const locked = commandName === "lock";

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: locked ? false : null,
      SendMessagesInThreads: locked ? false : null
    });

    return interaction.reply({
      embeds: [
        makeEmbed(
          locked ? "Channel Locked" : "Channel Unlocked",
          `${channel} has been ${locked ? "locked" : "unlocked"}.`
        )
      ]
    });
  }

  if (commandName === "slowmode") {
    if (!isAllowed(interaction, PermissionFlagsBits.ManageChannels)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: "I need the Manage Channels permission.", ephemeral: true });
    }

    const seconds = interaction.options.getInteger("seconds");

    if (!interaction.channel?.setRateLimitPerUser) {
      return interaction.reply({ content: "This channel doesn't support slowmode.", ephemeral: true });
    }

    await interaction.channel.setRateLimitPerUser(seconds);

    return interaction.reply({
      content: seconds === 0
        ? "Slowmode disabled."
        : `Slowmode set to ${seconds} second(s).`
    });
  }

  if (commandName === "nick") {
    if (!isAllowed(interaction, PermissionFlagsBits.ManageNicknames)) return denied(interaction);
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ content: "I need the Manage Nicknames permission.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const nickname = interaction.options.getString("nickname");
    const member = await guild.members.fetch(user.id).catch(() => null);

    
    if (!member) {
      return interaction.reply({
        content: "Member not found.",
        ephemeral: true
      });
    }

    if (!member.manageable) {
      return interaction.reply({
        content: "I cannot change this member's nickname due to role hierarchy.",
        ephemeral: true
      });
    }

    await member.setNickname(
      nickname.toLowerCase() === "reset" ? null : nickname,
      `Nickname updated by ${interaction.user.tag}`
    );

    return interaction.reply({
      content: `Updated nickname for ${user.tag}.`
    });
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
  const items = helpCategories[category];

  if (!items) {
    return interaction.reply({
      content: "Unknown help category.",
      ephemeral: true
    });
  }

  return interaction.update({
    embeds: [
      makeEmbed(`NOCTIS | ${category}`, items.join("\n"))
    ],
    components: [buildHelpMenu()]
  });
}

module.exports = {
  commands,
  handleInteraction,
  handleSelectMenu
};
        
