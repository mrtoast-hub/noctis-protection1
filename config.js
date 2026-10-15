
module.exports = {
  BOT_NAME: "NOCTIS PROTECTION",
  CREATOR: "NOCTIS",
  PREFIX: "n",

  TWITCH_URL: "https://www.twitch.tv/noctis_official01",

  COLORS: {
    primary: 0xffffff,
    success: 0x57f287,
    warning: 0xfee75c,
    danger: 0xed4245,
    neutral: 0x2b2d31
  },

  CATEGORIES: [
    "Home",
    "Moderation",
    "Utility",
    "Gambling",
    "Economy",
    "Partnership",
    "System"
  ],

  DEFAULT_SETTINGS: {
    prefix: "n",

    welcomeEnabled: false,
    welcomeChannelId: null,
    welcomeMessage:
      "Welcome {user} to **{server}**! You are member #{membercount}.",

    leaveEnabled: false,
    leaveChannelId: null,
    leaveMessage:
      "{username} has left **{server}**.",

    logChannelId: null,
    levelNotificationsEnabled: true,
    levelChannelId: null,

    partnershipChannelId: null,
    partnershipRoleId: null,
    partnershipDestinationId: null,

    antiRaidEnabled: false,
    antiNukeEnabled: false,
    antiSpamEnabled: false,

    disabledCommands: [],
    ignoredChannels: [],
    automodEnabled: false,

    createdAt: Date.now()
  },

  ECONOMY: {
    dailyCoins: 250,
    workMin: 50,
    workMax: 300,
    startingCoins: 0
  },

  XP: {
    min: 10,
    max: 20,
    cooldown: 60000
  },

  TICKET: {
    closeWord: "close",
    confirmWord: "confirm"
  }
};
