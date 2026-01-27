require("dotenv").config({ path: "../.env" });

const fs = require("fs");
const { Client, IntentsBitField, REST, Routes, Events } = require("discord.js");
const mongoose = require("mongoose");

const profileModel = require("./models/profileSchema.js");
const GuildSettings = require("./models/guildSettings.js");
const { playWordChain } = require("./wordchain.js");

// ===================== LOAD DICTIONARY =====================
const dictionary = new Set();
const wordsNotCheck = new Set();

function readFileToSet(filePath, storage) {
    const readStream = fs.createReadStream(filePath, { encoding: "utf8" });
    readStream.on("data", (data) => {
        data.split("\n").forEach((line) => storage.add(line.trim()));
    });
}

readFileToSet("../src/text/dictionary.txt", dictionary);
readFileToSet("../src/text/wordsNotCheck.txt", wordsNotCheck);

// ===================== DISCORD CLIENT =====================
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// ===== Slash commands definition =====
const commands = [
    {
        name: "addrole",
        description: "Add auto-role for a bot/feature",
        options: [
            {
                name: "role",
                type: 8,
                description: "Role to give",
                required: true,
            },
            {
                name: "botname",
                type: 3,
                description: "Bot name",
                required: true,
            },
        ],
    },
    {
        name: "removerole",
        description: "Remove auto-role for a bot/feature",
        options: [
            {
                name: "role",
                type: 8,
                description: "Role to remove",
                required: true,
            },
            {
                name: "botname",
                type: 3,
                description: "Bot name",
                required: true,
            },
        ],
    },
];

// ===== Helper: register commands for a guild =====
async function registerCommandsForGuild(guildId) {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, guildId),
            { body: commands },
        );
        console.log(`✅ Registered slash commands for guild: ${guildId}`);
    } catch (err) {
        console.error(
            `❌ Failed to register commands for guild ${guildId}`,
            err,
        );
    }
}

// ===================== PER-SERVER TYPING MAP =====================
const lastMessageTimestamps = new Map();
const typingThreshold = 2000;

// ===================== BOT READY =====================
client.on(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} is online`);
    client.guilds.cache.forEach((guild) => registerCommandsForGuild(guild.id));
});

// ===== Auto-register for new guilds =====
client.on(Events.GuildCreate, async (guild) => {
    console.log(`Joined new guild: ${guild.name}`);
    await registerCommandsForGuild(guild.id);
});

// ===================== MESSAGE HANDLER =====================
client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        const guildId = message.guild.id;
        const content = message.content.toLowerCase().trim();
        const userInputList = content.split(/\s+/);

        // ---------- Load or create server profile ----------
        let profileData = await profileModel.findOne({ serverId: guildId });

        if (!profileData) {
            profileData = await profileModel.create({ serverId: guildId });
        }

        // ---------- Setup typing map for this server ----------
        if (!lastMessageTimestamps.has(guildId)) {
            lastMessageTimestamps.set(guildId, new Map());
        }

        const guildTimestamps = lastMessageTimestamps.get(guildId);

        // ---------- START GAME COMMAND ----------
        if (userInputList[0] === "gwordchain") {
            if (userInputList.length < 2) {
                return message.channel.send(
                    "❌ Dùng: `gwordchain <channel_id>`",
                );
            }

            const channelId = userInputList[1].match(/\d+/)?.[0];

            if (!channelId) {
                return message.channel.send("❌ Channel ID không hợp lệ");
            }

            profileData.gameStart = true;
            profileData.channelId = channelId;
            await profileData.save();

            return message.channel.send(
                `✅ Game WordChain bắt đầu tại <#${channelId}>`,
            );
        }

        // ---------- Game not started ----------
        if (!profileData.gameStart) return;

        // ---------- Wrong channel ----------
        if (message.channel.id !== profileData.channelId) return;

        // ---------- Play WordChain ----------
        const channelMessage = await playWordChain(
            client,
            userInputList,
            dictionary,
            wordsNotCheck,
            message,
            profileData,
            guildTimestamps,
            typingThreshold,
        );

        if (channelMessage && channelMessage.length > 0) {
            message.channel.send(channelMessage);
        }
    } catch (err) {
        console.error("❌ Error in messageCreate:", err);
    }
});

// ===== Interaction handler (WordSeek / other bots) =====
client.on(Events.InteractionCreate, async (interaction) => {
    console.log("Slash command received:", interaction.commandName);
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
});

client.on(Events.MessageCreate, async (message) => {
    // -------------- Auto-role for other bots/features --------------
    if (message.author.bot && message.guild) {
        const guildId = message.guild.id;
        const botId = message.author.username;

        const userTaggedFromEmbed = message.embeds
            .map((embed) => embed.description)
            .join("\n")
            .match(/<@!?(\d+)>/);

        const userTaggedFromMessage = message.mentions.users.first()?.id;
        let userTaggedId = null;
        if (userTaggedFromEmbed) {
            userTaggedId = userTaggedFromEmbed[1];
        } else if (userTaggedFromMessage) {
            userTaggedId = userTaggedFromMessage;
        }

        if (!userTaggedId) {
            console.log("No user tagged in the message.");
            return;
        }
        console.log("User tagged ID:", userTaggedId);
        const settings = await GuildSettings.findOne({ guildId });
        if (!settings?.autoRoles?.length) return;

        for (const { botName, roleId } of settings.autoRoles) {
            if (botId === botName) {
                const member = await message.guild.members.fetch(userTaggedId);
                if (!member.roles.cache.has(roleId)) {
                    try {
                        await member.roles.add(roleId);
                        console.log(
                            `✅ Auto-role assigned: ${member.user.tag} -> Role ID: ${roleId}`,
                        );
                    } catch (err) {
                        console.error("Failed to assign role:", err);
                        if (err.code === 50001) {
                            // Missing Access error
                            message.channel.send(
                                `❌ I cannot assign the role <@&${roleId}> to ${member.user.tag}. I might be missing permissions or the role is above my highest role.`,
                            );
                        } else {
                            message.channel.send(
                                `❌ Failed to assign role <@&${roleId}> to ${member.user.tag}: ${err.message}`,
                            );
                        }
                    }
                }
            }
        }
    }
});

// ===================== DATABASE =====================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB error:", err));

// ===================== LOGIN =====================
console.log("Logging in with token:", process.env.TOKEN?.slice(0, 5) + "...");
client.login(process.env.TOKEN);
