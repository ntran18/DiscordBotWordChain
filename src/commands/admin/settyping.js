const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildSettings = require("../../models/guildSettings");
const { adminMessages } = require("../../services/ui/admin");
const { common } = require("../../services/ui/common");
const { safeReply, handleCommandError } = require("../../services/utils");

const MIN_MS = 500;
const MAX_MS = 5000;
const DEFAULT_MS = 2000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("settyping")
        .setDescription("Configure typing cooldown")
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Set typing cooldown (ms)")
                .addIntegerOption((option) =>
                    option
                        .setName("value")
                        .setDescription("Cooldown in ms (500-5000)")
                        .setMinValue(MIN_MS)
                        .setMaxValue(MAX_MS)
                        .setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("reset")
                .setDescription("Reset typing cooldown to default"),
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
                const value = interaction.options.getInteger("value", true);
                await GuildSettings.updateOne(
                    { guildId },
                    { $set: { typingThresholdMs: value } },
                    { upsert: true },
                );
                return safeReply(interaction, {
                    content: adminMessages.typingSet(value),
                    ephemeral: true,
                });
            }

            if (subcommand === "reset") {
                await GuildSettings.updateOne(
                    { guildId },
                    { $set: { typingThresholdMs: DEFAULT_MS } },
                    { upsert: true },
                );
                return safeReply(interaction, {
                    content: adminMessages.typingReset(DEFAULT_MS),
                    ephemeral: true,
                });
            }

            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "settyping");
        }
    },
};
