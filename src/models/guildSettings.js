const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    logChannelId: { type: String, default: null },
    typingThresholdMs: { type: Number, default: 2000 },
    autoRoles: [
        {
            botName: { type: String, required: true },
            roleId: { type: String, required: true },
        },
    ],
});

module.exports = mongoose.model("guildSettings", guildSettingsSchema);
