const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildSettings = require("../../models/guildSettings");
const { adminMessages } = require("../../services/ui/admin");
const { common } = require("../../services/ui/common");

async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Remove auto-role when a bot mentions the user")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Role to remove")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("botname")
                .setDescription("Bot/feature name")
                .setRequired(true),
        )
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
            const role = interaction.options.getRole("role");
            const botName = interaction.options.getString("botname");

            await GuildSettings.updateOne(
                { guildId },
                { $pull: { autoRoles: { botName, roleId: role.id } } },
            );

            return safeReply(interaction, {
                content: adminMessages.removeRoleSuccess(botName, role.name),
                ephemeral: true,
            });
        } catch (err) {
            console.error("/removerole error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
