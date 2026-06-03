const { SlashCommandBuilder, ChannelType } = require("discord.js");
const Profile = require("../../models/profileSchema");
const { gameMessages } = require("../../services/ui/game");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wordchain")
        .setDescription("Start word chain game")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("Channel to play the game")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false),
        ),
    adminOnly: true,
    ownerOnly: false,
    category: "game",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const targetChannel =
                interaction.options.getChannel("channel") ||
                interaction.channel;
            const guildId = interaction.guildId;

            const profile =
                (await Profile.findOne({ serverId: guildId })) ||
                (await Profile.create({ serverId: guildId }));

            profile.channelId = targetChannel.id;
            profile.gameStart = true;
            await profile.save();

            if (targetChannel?.isTextBased?.()) {
                targetChannel.send(gameMessages.gameStarted);
            }

            return safeReply(interaction, {
                content: `✅ Đã bắt đầu trò chơi tại #${targetChannel.name}.`,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "wordchain");
        }
    },
};
