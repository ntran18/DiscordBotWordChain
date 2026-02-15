const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const { utilMessages } = require("../../services/ui/util");
const { common } = require("../../services/ui/common");

async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

function canView(command, interaction, ownerId) {
    if (command.ownerOnly) {
        return ownerId && interaction.user.id === ownerId;
    }
    if (command.adminOnly) {
        return interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator,
        );
    }
    return true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show available commands"),
    adminOnly: false,
    ownerOnly: false,
    category: "util",
    /**
     * Execute the command.
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const { commandMap } = interaction.client;
            const ownerId = interaction.client.ownerId;
            const categories = {
                game: [],
                admin: [],
                util: [],
            };

            for (const command of commandMap.values()) {
                if (!canView(command, interaction, ownerId)) continue;
                const category = command.category || "util";
                const name = command.data.name;
                const description = command.data.description || "";
                categories[category] = categories[category] || [];
                categories[category].push(`/${name} - ${description}`);
            }

            const embed = new EmbedBuilder()
                .setTitle(utilMessages.helpTitle)
                .setDescription(utilMessages.helpDescription)
                .setColor(0x0099ff);

            if (categories.game.length) {
                embed.addFields({
                    name: "Games",
                    value: categories.game.join("\n"),
                });
            }
            if (categories.admin.length) {
                embed.addFields({
                    name: "Admin",
                    value: categories.admin.join("\n"),
                });
            }
            if (categories.util.length) {
                embed.addFields({
                    name: "Util",
                    value: categories.util.join("\n"),
                });
            }

            return safeReply(interaction, {
                embeds: [embed],
                ephemeral: true,
            });
        } catch (err) {
            console.error("/help error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
