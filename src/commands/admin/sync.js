const { SlashCommandBuilder, REST, Routes } = require("discord.js");
const { common } = require("../../services/ui/common");
const { adminMessages } = require("../../services/ui/admin");
const { canSync, markSynced } = require("../../services/admin/syncLimiter");
const { safeReply, handleCommandError } = require("../../services/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sync")
        .setDescription("Re-register global commands"),
    adminOnly: false,
    ownerOnly: true,
    category: "admin",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            if (!canSync()) {
                return safeReply(interaction, {
                    content: common.syncCooldown,
                    ephemeral: true,
                });
            }

            const rest = new REST({ version: "10" }).setToken(
                process.env.TOKEN,
            );

            const { commandData } = interaction.client;
            const data = await rest.put(
                Routes.applicationCommands(interaction.client.user.id),
                { body: commandData },
            );

            markSynced();
            return safeReply(interaction, {
                content: adminMessages.syncDone(data.length),
                ephemeral: true,
            });
        } catch (err) {
            return handleCommandError(interaction, err, "sync");
        }
    },
};
