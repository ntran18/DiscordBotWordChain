const fs = require("fs");
const path = require("path");

/**
 * Load and register events from a directory.
 * @param {import("discord.js").Client} client
 * @param {string} eventsDir
 */
function loadEvents(client, eventsDir) {
    if (!fs.existsSync(eventsDir)) return;

    const allowedFiles = new Set([
        "ready.js",
        "guildCreate.js",
        "interactionCreate.js",
        "messageCreate.js",
    ]);

    const files = fs
        .readdirSync(eventsDir)
        .filter((file) => file.endsWith(".js") && allowedFiles.has(file));

    for (const file of files) {
        const filePath = path.join(eventsDir, file);
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const event = require(filePath);
        if (!event?.name || typeof event.execute !== "function") {
            console.warn(`⚠️ Invalid event module: ${filePath}`);
            continue;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

module.exports = { loadEvents };
