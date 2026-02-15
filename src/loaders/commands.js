const fs = require("fs");
const path = require("path");

/**
 * Recursively collect .js files from a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectCommandFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectCommandFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Load command modules from a directory.
 * @param {string} commandsDir
 * @returns {{ commandMap: Map<string, any>, commandData: any[] }}
 */
function loadCommands(commandsDir) {
    const commandMap = new Map();
    const commandData = [];

    if (!fs.existsSync(commandsDir)) {
        return { commandMap, commandData };
    }

    const files = collectCommandFiles(commandsDir);
    for (const file of files) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const command = require(file);
        if (!command?.data?.name || typeof command.execute !== "function") {
            console.warn(`⚠️ Invalid command module: ${file}`);
            continue;
        }
        commandMap.set(command.data.name, command);
        commandData.push(command.data.toJSON());
    }

    return { commandMap, commandData };
}

module.exports = { loadCommands };
