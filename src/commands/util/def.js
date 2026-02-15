const { SlashCommandBuilder } = require("discord.js");
const {
    getDefinitionsAndExamplesFromLinguaRobot,
} = require("../../services/api/definition");
const {
    utilMessages,
    buildDefinitionEmbed,
} = require("../../services/ui/util");
const { common } = require("../../services/ui/common");

async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("def")
        .setDescription("Get definition of a word")
        .addStringOption((option) =>
            option
                .setName("word")
                .setDescription("Word to define")
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
            const word = interaction.options.getString("word", true);
            const data = await getDefinitionsAndExamplesFromLinguaRobot(word);
            if (!data?.entries?.length) {
                return safeReply(interaction, {
                    content: utilMessages.defNotFound,
                    ephemeral: true,
                });
            }

            const embed = buildDefinitionEmbed(word, data);
            return safeReply(interaction, {
                embeds: [embed],
                ephemeral: true,
            });
        } catch (err) {
            console.error("/def error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
