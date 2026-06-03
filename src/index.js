require("dotenv").config({ path: "../.env" });

const fs = require("fs");
const path = require("path");
const { Client, IntentsBitField } = require("discord.js");
const mongoose = require("mongoose");
const { loadCommands } = require("./loaders/commands");
const { loadEvents } = require("./loaders/events");

const requestsDir = path.join(__dirname, "..", "requests");

function ensureRequestsDir() {
    if (!fs.existsSync(requestsDir)) {
        fs.mkdirSync(requestsDir, { recursive: true });
    }
}

// ===================== DISCORD CLIENT =====================
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.ownerId = process.env.OWNER_ID || null;

// ===================== LOAD COMMANDS =====================
const commandsDir = path.join(__dirname, "commands");
const { commandMap, commandData } = loadCommands(commandsDir);
client.commandMap = commandMap;
client.commandData = commandData;

// ===================== LOAD EVENTS =====================
const eventsDir = path.join(__dirname, "events");
loadEvents(client, eventsDir);

// ===================== DATABASE =====================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB error:", err));

// ===================== STARTUP TASKS =====================
ensureRequestsDir();

// ===================== LOGIN =====================
console.log("Logging in with token:", process.env.TOKEN?.slice(0, 5) + "...");
client.login(process.env.TOKEN);
client.once("ready", async () => {
    await client.application.fetch();
    client.ownerId =
        client.application.owner.ownerId || client.application.owner.id;

    console.log(`Logged in as ${client.user.tag}. Owner ID saved!`);
});
