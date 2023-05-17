const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema({
    serverId: { type: String, require: true, unique: true}, 
    channelId: {type: String, default: 0},
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

const model = mongoose.model("noichudb", profileSchema)

module.exports = model