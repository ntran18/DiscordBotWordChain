const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require("discord.js");

const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removeusersbyrole")
        .setDescription(
            "Trục xuất (kick) tất cả người dùng có một vai trò cụ thể khỏi máy chủ",
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Vai trò mục tiêu cần trục xuất")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Lý do trục xuất (không bắt buộc)")
                .setMaxLength(100)
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldown: 60,
    adminOnly: true,
    category: "admin",

    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const role = interaction.options.getRole("role", true);
            const reason =
                interaction.options.getString("reason") ||
                `Trục xuất bởi lệnh /removeusersbyrole (Vai trò: ${role.name})`;

            await interaction.deferReply({ ephemeral: true });

            const allMembers = await interaction.guild.members.fetch({
                force: true,
            });

            const membersWithRole = allMembers.filter((m) =>
                m.roles.cache.has(role.id),
            );

            if (!membersWithRole || membersWithRole.size === 0) {
                return safeReply(interaction, {
                    content: `❌ Không tìm thấy thành viên nào có vai trò **${role.name}** trên máy chủ.`,
                    ephemeral: true,
                });
            }

            const kickableMembers = membersWithRole.filter((m) => m.kickable);
            const total = membersWithRole.size;
            const kickable = kickableMembers.size;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_remove_${interaction.id}`)
                    .setLabel("Xác nhận Xóa")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cancel_remove_${interaction.id}`)
                    .setLabel("Hủy bỏ")
                    .setStyle(ButtonStyle.Secondary),
            );

            const response = await interaction.editReply({
                content: `⚠️ **Yêu cầu xác nhận**\n\nTìm thấy **${total}** thành viên có vai trò **${role.name}**.\nTrong đó có **${kickable}** người có thể trục xuất (kick).\n\n**Danh sách người dùng sẽ bị trục xuất:**\n${kickableMembers.map((m) => `- ${m.user.tag}`).join("\n")}\n\n**Lý do:** ${reason}\n\nBạn có chắc chắn muốn tiếp tục không?`,
                components: [row],
            });

            const filter = (i) => i.user.id === interaction.user.id;
            const collector = response.createMessageComponentCollector({
                filter,
                max: 1,
                time: 60_000,
            });

            collector.on("collect", async (i) => {
                if (i.customId.startsWith("cancel")) {
                    return await i.update({
                        content: "✅ Đã hủy lệnh xóa người dùng.",
                        components: [],
                    });
                }

                await i.update({
                    content:
                        "⏳ Đang thực hiện trục xuất... Hệ thống có thể mất vài giây để xử lý.",
                    components: [],
                });

                let success = 0;
                let failed = 0;

                for (const member of kickableMembers.values()) {
                    try {
                        await member.kick(reason);
                        success++;
                    } catch (err) {
                        console.error(`Lỗi khi kick ${member.user.tag}:`, err);
                        failed++;
                    }
                }

                safeReply(interaction, {
                    content: `✅ Đã hoàn tất trục xuất! Tổng: **${total}**, Thành công: **${success}**, Thất bại: **${failed}**.\n*(Lưu ý: Bot không thể kick Chủ Server hoặc người có vai trò cao hơn bot)*`,
                    ephemeral: false,
                });
            });

            collector.on("end", async (collected, reason) => {
                if (reason === "time" && collected.size === 0) {
                    safeReply(interaction, {
                        content:
                            "⏰ Đã hết thời gian xác nhận (60 giây). Vui lòng chạy lại lệnh.",
                        ephemeral: true,
                    });
                }
            });
        } catch (err) {
            const messageToUsers =
                "❌ Có lỗi xảy ra khi truy cập danh sách thành viên. Hãy đảm bảo bot có quyền 'Server Members Intent' và vai trò của bot đủ cao.";
            return handleCommandError(
                interaction,
                err,
                "removeusersbyrole",
                messageToUsers,
            );
        }
    },
};
