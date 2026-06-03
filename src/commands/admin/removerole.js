const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildSettings = require("../../models/guildSettings");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Xóa vai trò tự động khi một bot nhắc đến người dùng")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Vai trò cần xóa")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("botname")
                .setDescription("Tên Bot hoặc tính năng")
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
                content: `🗑️ Đã xóa thành công! Vai trò **${role.name}** sẽ không còn được tự động cấp khi bot **${botName}** nhắc đến người dùng nữa.`,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "removerole");
        }
    },
};
