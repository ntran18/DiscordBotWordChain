const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removeusersbyrole")
        .setDescription(
            "Remove (kick) all users with a specific role from the server",
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Role to target for removal")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for removal (optional)")
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
                `Trục xuất bởi lệnh /removeusersbyrole (Role: ${role.name})`;

            // Bước 1: Trả lời tạm thời để tránh lỗi timeout (3s) của Discord
            await interaction.deferReply({ ephemeral: true });

            console.log(
                `Đang quét API Discord cho role: ${role.name} tại ${interaction.guild.name}`,
            );

            // Bước 2: Bỏ qua Cache, buộc bot tải danh sách thành viên mới nhất từ API
            // Sử dụng force: true giúp khắc phục lỗi bị "stuck" khi chạy lại lệnh
            const allMembers = await interaction.guild.members.fetch({
                force: true,
            });

            // Lọc những thành viên thực sự có role này
            const membersWithRole = allMembers.filter((m) =>
                m.roles.cache.has(role.id),
            );

            if (!membersWithRole || membersWithRole.size === 0) {
                return interaction.editReply({
                    content: `❌ Không tìm thấy thành viên nào có role **${role.name}** trên server.`,
                });
            }

            // Bước 3: Kiểm tra những ai có thể kick được (Hierarchy check)
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

            // Change the content message to include list of users to be removed and a confirmation prompt
            const response = await interaction.editReply({
                content: `⚠️ **Yêu cầu xác nhận**\n\nTìm thấy **${total}** thành viên có role **${role.name}**.\nTrong đó có **${kickable}** người có thể trục xuất (kick).\n\nDanh sách người dùng sẽ bị trục xuất:\n${kickableMembers.map((m) => `- ${m.user.tag}`).join("\n")}\n\n**Lý do:** ${reason}\n\nBạn có chắc chắn muốn tiếp tục không?`,
                components: [row],
            });

            // Bước 4: Collector xử lý tương tác nút bấm
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

                // Xử lý tuần tự để tránh bị Rate Limit bởi Discord
                for (const member of kickableMembers.values()) {
                    try {
                        await member.kick(reason);
                        success++;
                    } catch (err) {
                        console.error(`Lỗi khi kick ${member.user.tag}:`, err);
                        failed++;
                    }
                }

                await interaction.editReply({
                    content: `🏁 **Hoàn tất xử lý**\n- Thành công: **${success}**\n- Thất bại: **${failed}**\n*(Lưu ý: Bot không thể kick Server Owner hoặc người có role cao hơn bot)*`,
                });
            });

            collector.on("end", async (collected, reason) => {
                if (reason === "time" && collected.size === 0) {
                    await interaction.editReply({
                        content:
                            "⏰ Đã hết thời gian xác nhận (60s). Vui lòng chạy lại lệnh.",
                        components: [],
                    });
                }
            });
        } catch (err) {
            console.error("Lỗi thực thi lệnh /removeusersbyrole:", err);
            const errorMessage =
                "❌ Có lỗi xảy ra khi truy cập danh sách thành viên. Hãy đảm bảo bot có quyền 'Server Members Intent' và Role của bot đủ cao.";

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true,
                });
            }
        }
    },
};
