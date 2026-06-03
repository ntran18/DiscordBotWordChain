const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { utilMessages } = require("../../services/ui/util");
const { common } = require("../../services/ui/common");
const {
    safeReply,
    sendBotOwnerDm,
    handleCommandError,
} = require("../../services/utils");

const requestsDir = path.join(__dirname, "..", "..", "..", "requests");

function ensureRequestsDir() {
    if (!fs.existsSync(requestsDir)) {
        fs.mkdirSync(requestsDir, { recursive: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("support")
        .setDescription(
            "Gửi yêu cầu hỗ trợ hoặc phản hồi đến đội ngũ phát triển",
        )
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription("Nội dung yêu cầu hoặc phản hồi của bạn")
                .setRequired(true),
        ),
    adminOnly: false,
    ownerOnly: false,
    category: "util",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            ensureRequestsDir();
            const requestText = interaction.options.getString("message", true);
            const guildId = interaction.guildId;
            const channel = interaction.channel;
            const authorTag = interaction.user.tag;
            const timestamp = new Date().toISOString();

            const line = `[${timestamp}] ${authorTag} | #${channel?.name ?? "unknown"} (${channel?.id ?? ""}) | ${requestText}`;
            const filePath = path.join(requestsDir, `${guildId}.txt`);
            fs.appendFileSync(filePath, `${line}\n`);

            const channelMention = channel?.id
                ? `<#${channel.id}>`
                : "(không rõ kênh)";
            const messageToOwner = `Yêu cầu mới từ ${authorTag} tại ${interaction.guild?.name ?? "unknown"} - ${channelMention} (${channel?.name ?? "unknown"}):\n${requestText}`;

            await sendBotOwnerDm(interaction.client, messageToOwner);

            return safeReply(interaction, {
                content: utilMessages.requestReceived,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "support");
        }
    },
};
