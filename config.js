
module.exports = {
  BOT_NAME: "NOCTIS PROTECTION",
  CREATOR: "NOCTIS",
  PREFIXES: ["n", "!"],

  TWITCH_URL: "https://www.twitch.tv/noctis_official01",

  ACTIVITIES: [
    { type: 3, text: "your server" },
    { type: 3, text: "Protecting Server" }
  ],

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
    welcomeEnabled: false,
    welcomeChannelId: null,
    welcomeMessage: "Welcome {user} to **{server}**! You are member #{membercount}.",

    leaveEnabled: false,
    leaveChannelId: null,
    leaveMessage: "{username} has left **{server}**.",

    levelNotificationsEnabled: true,
    levelChannelId: null,

    partnershipChannelId: null,
    partnershipRoleId: null,
    partnershipDestinationId: null,

    logChannelId: null,
    antinukeEnabled: false
  }
};
