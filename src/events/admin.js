const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const GuildSettings = require("../models/guildSettings");

const commands = [
    new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Add auto-role for a bot/feature")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Role to give")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("botname")
                .setDescription("Bot/feature name")
                .setRequired(true),
        ),

    new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Remove auto-role for a bot/feature")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Role to remove")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("botname")
                .setDescription("Bot/feature name")
                .setRequired(true),
        ),
];

async function registerCommands(clientId, guildId, token) {
    const rest = new REST({ version: "10" }).setToken(token);
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

async function handleCommand(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guildId;
    const role = interaction.options.getRole("role");
    const botName = interaction.options.getString("botname");

    if (interaction.commandName === "addrole") {
        await GuildSettings.updateOne(
            { guildId },
            { $push: { autoRoles: { botName, roleId: role.id } } },
            { upsert: true },
        );
        await interaction.reply({
            content: `✅ Auto-role for ${botName} added: ${role.name}`,
            ephemeral: true,
        });
    }

    if (interaction.commandName === "removerole") {
        await GuildSettings.updateOne(
            { guildId },
            { $pull: { autoRoles: { botName, roleId: role.id } } },
        );
        await interaction.reply({
            content: `❌ Auto-role for ${botName} removed: ${role.name}`,
            ephemeral: true,
        });
    }
}

module.exports = { registerCommands, handleCommand };
