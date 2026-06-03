const { SlashCommandBuilder } = require("discord.js");
const Profile = require("../../models/profileSchema");
const { gameMessages } = require("../../services/ui/game");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("maxword")
        .setDescription("Set maximum words for a game")
        .addIntegerOption((option) =>
            option
                .setName("value")
                .setDescription("Max words (>= 10)")
                .setMinValue(10)
                .setRequired(true),
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
            const value = interaction.options.getInteger("value", true);
            const guildId = interaction.guildId;
            const profile =
                (await Profile.findOne({ serverId: guildId })) ||
                (await Profile.create({ serverId: guildId }));
            profile.maxCount = value;
            await profile.save();
            return safeReply(interaction, {
                content: gameMessages.maxWordUpdated(value),
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "maxword");
        }
    },
};
