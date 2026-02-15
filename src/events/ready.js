const { REST, Routes, Events } = require("discord.js");
const { ensureGameDataFiles } = require("../services/game");

module.exports = {
    name: Events.ClientReady,
    once: true,
    /**
     * @param {import("discord.js").Client} client
     */
    async execute(client) {
        console.log(`✅ ${client.user.tag} is online`);
        try {
            ensureGameDataFiles();
            const rest = new REST({ version: "10" }).setToken(
                process.env.TOKEN,
            );
            await rest.put(Routes.applicationCommands(client.user.id), {
                body: client.commandData,
            });
            if (process.env.DEV_GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(
                        client.user.id,
                        process.env.DEV_GUILD_ID,
                    ),
                    { body: client.commandData },
                );
                console.log(
                    `✅ Dev guild commands registered: ${process.env.DEV_GUILD_ID}`,
                );
            }
            // Print list of registered commands for verification
            console.log(
                "Registered commands:",
                client.commandData.map((cmd) => cmd.name).join(", "),
            );
            console.log("✅ Global commands registered");
        } catch (err) {
            console.error("❌ Failed to register global commands", err);
        }
    },
};
