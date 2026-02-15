const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
} = require("discord.js");
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
        .setName("setlogchannel")
        .setDescription("Configure auto-role log channel")
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Set log channel")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Log channel")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub.setName("disable").setDescription("Disable auto-role logging"),
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
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "set") {
                const channel = interaction.options.getChannel("channel", true);
                await GuildSettings.updateOne(
                    { guildId },
                    { $set: { logChannelId: channel.id } },
                    { upsert: true },
                );
                return safeReply(interaction, {
                    content: adminMessages.logChannelSet(channel.name),
                    ephemeral: true,
                });
            }

            if (subcommand === "disable") {
                await GuildSettings.updateOne(
                    { guildId },
                    { $set: { logChannelId: null } },
                    { upsert: true },
                );
                return safeReply(interaction, {
                    content: adminMessages.logChannelDisabled,
                    ephemeral: true,
                });
            }

            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        } catch (err) {
            console.error("/setlogchannel error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
