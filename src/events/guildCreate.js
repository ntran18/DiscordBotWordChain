const { Events } = require("discord.js");
const GuildSettings = require("../models/guildSettings");

module.exports = {
    name: Events.GuildCreate,
    once: false,
    /**
     * @param {import("discord.js").Guild} guild
     */
    async execute(guild) {
        try {
            await GuildSettings.updateOne(
                { guildId: guild.id },
                {
                    $setOnInsert: {
                        guildId: guild.id,
                        logChannelId: null,
                        typingThresholdMs: 2000,
                        autoRoles: [],
                    },
                },
                { upsert: true },
            );
            console.log(`✅ Initialized settings for guild: ${guild.name}`);
        } catch (err) {
            console.error("Failed to init guild settings:", err);
        }
    },
};
