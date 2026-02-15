const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { utilMessages } = require("../../services/ui/util");
const { common } = require("../../services/ui/common");

const requestsDir = path.join(__dirname, "..", "..", "..", "requests");

async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

function ensureRequestsDir() {
    if (!fs.existsSync(requestsDir)) {
        fs.mkdirSync(requestsDir, { recursive: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("request")
        .setDescription("Send a request to the bot owner")
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription("Your request")
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

            const ownerId = interaction.client.ownerId;
            if (ownerId) {
                try {
                    const owner = await interaction.client.users.fetch(ownerId);
                    const channelMention = channel?.id
                        ? `<#${channel.id}>`
                        : "(không rõ kênh)";
                    await owner.send(
                        `Yêu cầu mới từ ${authorTag} tại ${interaction.guild?.name ?? "unknown"} - ${channelMention} (${channel?.name ?? "unknown"}):\n${requestText}`,
                    );
                } catch (dmErr) {
                    console.error("Failed to DM owner:", dmErr);
                }
            }

            return safeReply(interaction, {
                content: utilMessages.requestReceived,
                ephemeral: true,
            });
        } catch (err) {
            console.error("/request error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
