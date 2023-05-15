require('dotenv').config()

const fs = require('fs')
const filePath = "src/dictionary.txt"
const dictionary = new Set()

const {playWordChain} = require('./wordchain.js')

// Import Client and IntentsBitField classes from Discord.js
// Client is the bot
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');

// Variables for database
const mongoose = require('mongoose')
const profileModel = require("./models/profileSchema.js")


// ================================= READ TEXT FILE AND COLLECT WORDS =================================
const readStream = fs.createReadStream(filePath, { encoding: "utf8" })

readStream.on("data", (data) => {
    const lines = data.split("\n")
    lines.forEach(line => {
        dictionary.add(line)
    });
})


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
            profileData = await profileModel.findOne({serverId: message.serverId})
            if (!profileData) {
                profileData = await profileModel.create({
                    serverId: message.serverId
                })
            }
            id = profileData._id
            console.log(profileData, id)
        } catch (error) {
            console.log(error)
        }


        // Get start channel
        const word = message.content.toLowerCase().trim()

        const userInputList = word.split(" ")

        let channelMessage = ""
        
        if (userInputList[0] === 'gnoichu') {
            if (userInputList.length > 1) {
                const userInputChannelID = userInputList[1].match(/\d+/)[0]
                if (!isNaN(userInputChannelID)) {
                    profileData.channelId = userInputChannelID
                    await profileData.save()
                    console.log(typeof profileData.channelId)
                }
                else {
                    channelMessage = 'Xin hãy nhập đúng lệnh `gnoichu <id của kênh chat>`'
                }
            } else {
                channelMessage = 'Xin hãy nhập đúng lệnh `gnoichu <id của kênh chat>`'
            }
            
        }

        // Play word chain if the user is typing in the correct channel
        if (message.channelId === profileData.channelId && !message.author.bot) {
            channelMessage = await playWordChain(userInputList, dictionary, message, profileData)
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