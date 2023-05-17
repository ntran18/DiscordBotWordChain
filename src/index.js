require('dotenv').config()

const fs = require('fs')
// const filePath = "src/dictionary.txt"
const dictionary = new Set()
const wordsNotCheck = new Set()

const {playWordChain} = require('./wordchain.js')

// Map to store the last message timestamps for each user
const lastMessageTimestamps = new Map()

// Threshold time in milliseconds
const typingThreshold = 2000


// Import Client and IntentsBitField classes from Discord.js
// Client is the bot
const { Client, IntentsBitField } = require('discord.js');

// Variables for database
const mongoose = require('mongoose')
const profileModel = require("./models/profileSchema.js")


function readFileToSet (filePath, storage) {
    const readStream = fs.createReadStream(filePath, { encoding: "utf8" })

    readStream.on("data", (data) => {
        const lines = data.split("\n")
        lines.forEach(line => {
            storage.add(line)
        });
    })
}


// ================================= READ TEXT FILE AND COLLECT WORDS =================================
readFileToSet("src/text/dictionary.txt", dictionary)
readFileToSet('src/text/wordsNotCheck.txt', wordsNotCheck)


// ================================= BOT =================================
const client = new Client({
    // Intents is a set of permissions that your bot can use to get access to a set of events 
    intents: [
        // Guilds is a server
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})


// ================================= BOT READY =================================
client.on('ready', (c) => {
    // user.tag shows username and tag, user.username only shows bot username
    console.log(`${c.user.tag} is online.`)
})

// ================================= BOT SEE MESSAGES=================================
client.on('messageCreate', async (message) => {
    if (!message.author.bot) {
        // Get server db information and pass to command
        let profileData;
        let id;
        try {
            profileData = await profileModel.findOne({serverId: message.guildId})
            console.log("Server id by message", message.guildId)
            if (!profileData) {
                profileData = await profileModel.create({
                    serverId: message.guildId,
                    previousWord: "",
                    previousPlayer: "",
                    maxCount: 500,
                    wordCount: 0,
                    usedWords: new Set()
                })
            }
            id = profileData._id
            console.log(profileData, id)
            console.log("Server id", profileData.serverId)
        } catch (error) {
            console.log(error)
        }


        // Get start channel
        const word = message.content.toLowerCase().trim()

        const userInputList = word.split(" ")

        let channelMessage = ""
        
        console.log(userInputList)
        if (userInputList[0] === 'gwordchain') {
            console.log("User wants to start game")
            if (userInputList.length > 1) {
                const userInputChannelID = userInputList[1].match(/\d+/)[0]
                if (!isNaN(userInputChannelID) && userInputChannelID.length >= 18) {
                    message.channel.send(`Bây giờ bạn có thể chơi nối chữ tại kênh chat <#${userInputChannelID}>`)
                    profileData.channelId = userInputChannelID
                    await profileData.save()
                }
                else {
                    channelMessage = 'Xin hãy nhập đúng lệnh `gwordchain <id của kênh chat>, bạn có thể đã nhập một channel ID không hợp lệ`'
                }
            } else {
                channelMessage = 'Xin hãy nhập đúng lệnh `gwordchain <id của kênh chat>`'
            }
            
        }

        // Play word chain if the user is typing in the correct channel
        if (!message.author.bot) {
            channelMessage = await playWordChain(client, userInputList, dictionary, wordsNotCheck, message, profileData, lastMessageTimestamps, typingThreshold)
        }

        // Show channelMessage if not empty
        if (channelMessage.length > 0) {
            message.channel.send(channelMessage)
        }
    }
    
})


// ================================= DATABASE =================================
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to the database!")
})
.catch((err) => {
    console.log(err)
})


// Log in our bot
// login(password) - password is bot token which is gotten from Bot Developer
client.login(process.env.TOKEN)

// In order to make bot online, in terminal, run nodemon