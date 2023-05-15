const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema({
    channelId: {type: String, unique: true, default: 0},
    serverId: { type: String, require: true, unique: true}, 
    maxCount: {type: Number, default: 500},
    wordCount: {type: Number, default: 0},
    previousWord: {type: String, default: ""},
    previousPlayer: {type: String, default: ""},
    usedWords: {
        type: [String],
        get: function(val) {
            return new Set(val);
        },
        set: function(val) {
            return Array.from(val);
        },
        default: []
    }
})

const model = mongoose.model("noichuDB", profileSchema)

module.exports = model