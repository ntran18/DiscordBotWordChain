const { Events } = require("discord.js");
const Profile = require("../models/profileSchema");
const GuildSettings = require("../models/guildSettings");
const { handleWordChainMessage } = require("../services/game");
const { handleAutoRole } = require("../services/admin/autoRole");
const { common } = require("../services/ui/common");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    /**
     * @param {import("discord.js").Message} message
     */
    async execute(message) {
        try {
            if (message.author.bot && message.guild) {
                await handleAutoRole(message);
                return;
            }

            if (message.author.bot || !message.guild) return;

            const guildId = message.guild.id;
            const profile =
                (await Profile.findOne({ serverId: guildId })) ||
                (await Profile.create({ serverId: guildId }));
            const settings = await GuildSettings.findOne({ guildId });

            const channelMessage = await handleWordChainMessage(
                message,
                profile,
                settings,
            );
            if (channelMessage) {
                message.channel.send(channelMessage);
            }
        } catch (err) {
            console.error("messageCreate error:", err);
            try {
                if (message.channel?.isTextBased?.()) {
                    message.channel.send(common.genericError);
                }
            } catch (sendErr) {
                console.error("Failed to send error message:", sendErr);
            }
        }
    },
};
