const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
} = require("discord.js");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

const DISCORD_MESSAGE_MAX = 2000;
const SLASH_STRING_MAX = 6000;

/**
 * Split text into chunks <= 2000 chars, prioritizing line-break boundaries.
 * Preserves user line breaks when possible, and hard-splits very long lines.
 * @param {string} text
 * @returns {string[]}
 */
function splitMessagePreserveLines(text) {
    const normalized = (text || "").replace(/\r\n/g, "\n");
    if (!normalized) return [];

    const lines = normalized.split("\n");
    const chunks = [];
    let current = "";

    const pushCurrent = () => {
        if (current.length > 0) {
            chunks.push(current);
            current = "";
        }
    };

    for (const line of lines) {
        if (line.length > DISCORD_MESSAGE_MAX) {
            pushCurrent();
            let start = 0;
            while (start < line.length) {
                chunks.push(line.slice(start, start + DISCORD_MESSAGE_MAX));
                start += DISCORD_MESSAGE_MAX;
            }
            continue;
        }

        const candidate = current.length === 0 ? line : `${current}\n${line}`;

        if (candidate.length <= DISCORD_MESSAGE_MAX) {
            current = candidate;
        } else {
            pushCurrent();
            current = line;
        }
    }

    pushCurrent();
    return chunks;
}

function isImageAttachment(attachment) {
    if (!attachment) return false;

    if (attachment.contentType?.startsWith("image/")) return true;

    const name = attachment.name || "";
    return /\.(png|jpe?g|gif|webp|bmp|tiff|svg)$/i.test(name);
}

function getFirstImageAttachment(message) {
    if (!message?.attachments?.size) return null;

    for (const attachment of message.attachments.values()) {
        if (isImageAttachment(attachment)) return attachment;
    }

    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Gửi tin nhắn/text hoặc sao chép từ ID tin nhắn")
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription(
                    "Tin nhắn muốn gửi (không bắt buộc nếu đã cung cấp source_message_id)",
                )
                .setMaxLength(SLASH_STRING_MAX)
                .setRequired(false),
        )
        .addAttachmentOption((option) =>
            option
                .setName("image")
                .setDescription("Hình ảnh đính kèm")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("source_message_id")
                .setDescription(
                    "ID của tin nhắn muốn sao chép (đặt source_channel nếu là kênh khác)",
                )
                .setRequired(false),
        )

        .addChannelOption((option) =>
            option
                .setName("source_channel")
                .setDescription(
                    "Kênh chứa tin nhắn nguồn (nếu khác kênh hiện tại)",
                )
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.PublicThread,
                    ChannelType.PrivateThread,
                    ChannelType.AnnouncementThread,
                )
                .setRequired(false),
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription(
                    "Kênh tin nhắn sẽ gửi tới (mặc định: kênh hiện tại)",
                )
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldown: 5,
    adminOnly: true,
    ownerOnly: false,
    category: "admin",

    /**
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const inputContent = interaction.options.getString("message") || "";
            const inputImage = interaction.options.getAttachment("image");
            const sourceMessageId =
                interaction.options.getString("source_message_id") || null;
            const sourceChannel =
                interaction.options.getChannel("source_channel") ||
                interaction.channel;
            const targetChannel =
                interaction.options.getChannel("channel") ||
                interaction.channel;

            if (!targetChannel || !targetChannel.isTextBased()) {
                return safeReply(interaction, {
                    content: "Kênh đích không hợp lệ để gửi tin nhắn.",
                    ephemeral: true,
                });
            }

            let content = inputContent;
            let image = inputImage;

            if (sourceMessageId) {
                if (!sourceChannel || !sourceChannel.isTextBased()) {
                    return safeReply(interaction, {
                        content: "Kênh nguồn không hợp lệ.",
                        ephemeral: true,
                    });
                }

                let sourceMessage;
                try {
                    sourceMessage =
                        await sourceChannel.messages.fetch(sourceMessageId);
                } catch (error) {
                    return safeReply(interaction, {
                        content:
                            "Không tìm thấy source message. Hãy kiểm tra message ID và source channel.",
                        ephemeral: true,
                    });
                }

                if (!content) {
                    content = sourceMessage.content || "";
                }

                if (!image) {
                    image = getFirstImageAttachment(sourceMessage);
                }
            }

            if (!content && !image) {
                return safeReply(interaction, {
                    content:
                        "Vui lòng nhập message/image hoặc cung cấp source_message_id có nội dung.",
                    ephemeral: true,
                });
            }

            if (image && !isImageAttachment(image)) {
                return safeReply(interaction, {
                    content: "File đính kèm phải là image.",
                    ephemeral: true,
                });
            }

            const chunks = splitMessagePreserveLines(content);

            if (chunks.length === 0 && image) {
                await targetChannel.send({
                    files: [{ attachment: image.url, name: image.name }],
                    allowedMentions: { parse: [] },
                });
            } else {
                for (let i = 0; i < chunks.length; i += 1) {
                    await targetChannel.send({
                        content: chunks[i],
                        files:
                            i === 0 && image
                                ? [{ attachment: image.url, name: image.name }]
                                : [],
                        allowedMentions: { parse: [] },
                    });
                }
            }

            const sentCount = Math.max(chunks.length, 1);
            return safeReply(interaction, {
                content: `✅ Đã gửi ${sentCount} tin nhắn ở #${targetChannel.name}.`,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "say");
        }
    },
};
