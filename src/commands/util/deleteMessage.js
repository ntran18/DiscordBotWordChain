const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { safeReply, handleCommandError } = require("../../services/utils");

function validTargetedUser(targetedUser, interaction) {
    const isAdmin = interaction.member.permissions.has(
        PermissionFlagsBits.Administrator,
    );
    if (!isAdmin && targetedUser && targetedUser.id !== interaction.user.id) {
        return false;
    }
    return true;
}

async function fetchMessages(messages, amount, targetedUser) {
    let messagesToDelete = [];
    let lastMessageId = null;
    const thirtyDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
    let reachedEnd = false;

    while (messagesToDelete.length < amount && !reachedEnd) {
        const fetchOptions = { limit: 100 };

        if (lastMessageId) {
            fetchOptions.before = lastMessageId;
        }

        const fetchedBatch = await messages.fetch(fetchOptions);

        if (fetchedBatch.size === 0) {
            reachedEnd = true;
            break;
        }

        lastMessageId = fetchedBatch.last().id;

        for (const message of fetchedBatch.values()) {
            if (message.createdTimestamp < thirtyDaysAgo) {
                reachedEnd = true;
                break;
            }

            const isFromTargetedUser = message.author.id === targetedUser.id;
            if (isFromTargetedUser) {
                messagesToDelete.push(message);
                if (messagesToDelete.length >= amount) {
                    break;
                }
            }
        }

        if (fetchedBatch.size < 100) {
            reachedEnd = true;
        }
    }
    return messagesToDelete;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletemessage")
        .setDescription("Xoá tin nhắn")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Số lượng tin nhắn cần xoá (1-100)")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true),
        )
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription(
                    "Người dùng cần xoá tin nhắn của họ (tuỳ chọn)",
                ),
        ),
    cooldown: 60,
    adminOnly: false,
    category: "util",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const amount = interaction.options.getInteger("amount", true);
            let targetedUser = interaction.options.getUser("user");

            if (!validTargetedUser(targetedUser, interaction)) {
                return safeReply(interaction, {
                    content: "❌ Bạn chỉ có thể xoá tin nhắn của chính mình.",
                    ephemeral: true,
                });
            }
            targetedUser = targetedUser || interaction.user;

            const messagesToDelete = await fetchMessages(
                interaction.channel.messages,
                amount,
                targetedUser,
            );

            if (messagesToDelete.length === 0) {
                const message = targetedUser
                    ? `❌ Không tìm thấy tin nhắn nào của **${targetedUser.tag}** gửi trong vòng 30 ngày qua trên kênh này.`
                    : "❌ Không tìm thấy tin nhắn nào hợp lệ trong vòng 30 ngày qua để xóa.";
                return await safeReply(interaction, {
                    content: message,
                    ephemeral: true,
                });
            }

            const deletedMessages = await interaction.channel.bulkDelete(
                messagesToDelete,
                true,
            );

            let responseMessage = `✅ Đã xoá thành công **${deletedMessages.size}** tin nhắn của **${targetedUser.tag}**.`;

            if (deletedMessages.size < amount) {
                responseMessage += ` Các tin nhắn còn lại không thể xoá có thể vì đã gửi quá 14 ngày hoặc không tìm thấy.`;
            }
            return await safeReply(interaction, {
                content: responseMessage,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "deletemessage");
        }
    },
};
