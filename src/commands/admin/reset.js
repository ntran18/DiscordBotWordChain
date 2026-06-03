const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Profile = require("../../models/profileSchema");
const { gameMessages } = require("../../services/ui/game");
const { common } = require("../../services/ui/common");
const { resetGame } = require("../../services/game");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stop the game")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldown: 60,
    adminOnly: true,
    ownerOnly: false,
    category: "admin",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const profile =
                (await Profile.findOne({ serverId: guildId })) ||
                (await Profile.create({ serverId: guildId }));
            await resetGame(profile, { stop: true });

            if (interaction.channel?.isTextBased?.()) {
                interaction.channel.send(gameMessages.gameStopped);
            }

            return safeReply(interaction, {
                content: "✅ Đã dừng trò chơi.",
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "reset");
        }
    },
};
