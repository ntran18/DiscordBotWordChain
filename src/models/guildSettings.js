const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    autoRoles: [
        {
            botName: { type: String, required: true },
            roleId: { type: String, required: true },
        },
    ],
});

module.exports = mongoose.model("guildSettings", guildSettingsSchema);
