const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildSettings = require("../../models/guildSettings");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Thêm vai trò tự động khi một bot nhắc đến người dùng")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Vai trò cần cấp")
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
                { $push: { autoRoles: { botName, roleId: role.id } } },
                { upsert: true },
            );

            return safeReply(interaction, {
                content: `✅ Đã thiết lập thành công! Vai trò **${role.name}** sẽ được tự động cấp khi bot **${botName}** nhắc đến người dùng.`,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "addrole");
        }
    },
};
