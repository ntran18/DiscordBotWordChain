const { getExamples, getDefinitionsFromWordsAPI } = require('./definition.js') 
const {EmbedBuilder} = require('discord.js')
const fs = require('fs');
const { text } = require('stream/consumers');

const maikaID = '712551540597981224'

function isCheckingWord (string, lastMessageTimestamps, typingThreshold, message) {

    if (lastMessageTimestamps.has(message.author.id)) {
        const lastTimestamp = lastMessageTimestamps.get(message.author.id)
        const currentTime = Date.now()
        const timeDiff = currentTime - lastTimestamp

        if (timeDiff < typingThreshold) {
            message.channel.send('Bạn đang gõ quá nhanh. Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo')
            return false
        }
    }

    lastMessageTimestamps.set(message.author.id, Date.now())
    return string.split(" ").length == 1 && /^[a-zA-Z\s-]+$/.test(string);
}

function isCorrectStartingLetter (currentWord, profileData) {
    if (profileData.wordCount === 0) {
        return true;
    }

    const {previousWord} = profileData
    
    return currentWord[0] === previousWord[previousWord.length - 1]
}

function isPreviousPlayer (currentPlayer, profileData) {
    if (profileData.wordCount === 0) {
        return false;
    } 

    const { previousPlayer } = profileData

    return currentPlayer === previousPlayer
}

async function reset(profileData) {
    profileData.usedWords.clear()
    profileData.wordCount = 0
    profileData.previousPlayer = ""
    profileData.previousWord = ""

    await profileData.save()
}

function showHelpMessage (message, client) {
    const helpMessage = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({ name: 'Command List', iconURL: message.author.displayAvatarURL(), url: 'https://discord.js.org' })
        .setDescription(`Danh sách lệnh của **${client.user.username}** \nCần sự giúp đỡ nhiều hơn? Tag <@${maikaID}> `)
        .addFields(
            { name: 'Bắt đầu trò chơi', value: '`gwordchain <kênh chat bạn muốn bắt đầu>`'},
            { name: 'Định nghĩa', value: '`gdef <từ cần định nghĩa>`' },
            { name: 'Làm mới trò chơi', value: '`greset`'},
            { name: 'Cài đặt số lượng từ tối đa', value: '`gmaxword <số lượng từ tối đa>`'},
            { name: 'Yêu cầu thêm từ mới', value: '`grequest <yêu cầu của bạn>`'},
        )
    message.channel.send({embeds: [helpMessage]})
}

async function showDefinitionMessage (message, word) {
    const data = await getDefinitionsFromWordsAPI(word)

    if (data.hasOwnProperty('definitions')) {
        const definitions = getDefinitionsList(data.definitions)
        const examplesData = await getExamples(word)
        let examples = ""
        if (examplesData.result_msg === 'Success') {
            examples = getExamplesList(examplesData.example)
        } else {
            examples = "Hiện đang không có ví dụ nào cho từ này"
        }

        const defintionMessage = new EmbedBuilder() 
            .setColor(0x0099FF)
            .setTitle(word)
            .addFields(
                {name: "Định nghĩa:", value: definitions}, 
                {name: "Ví dụ: ", value: examples}
            )
        message.channel.send({embeds: [defintionMessage]})
    } else {
        message.channel.send('Xin lỗi từ vựng này không có trong từ điển tôi tìm được trên mạng.\nNếu từ này được check đúng từ bot, đó là từ được thêm vô riêng từ Maika')
    }
}

function getDefinitionsList(defintions) {
    let result = ""
    defintions.forEach(def => {
        result += `(${def.partOfSpeech}) ${def.definition}\n`
    })
    
    return result
}

function getExamplesList(examples) {
    let result = ""
    examples.forEach(ex => result += `${ex}\n`)
    return result
}

function addTextToFile(text, filePath) {
    fs.appendFile(filePath, text + "\n", (err) => {
        if (err) {
            console.log('Error appending text to file:', err)
        } else {
            console.log('Text added to file successfully')
        }
    })
}

const playWordChain = async function(client, userInputList, dictionary, wordsNotCheck, message, profileData, lastMessageTimestamps, typingThreshold) {
    const word = message.content.toLowerCase().trim()
    let channelMessage = ""

    if (userInputList[0] === 'ghelp') {
        showHelpMessage(message, client)
    } else if (word === "greset") {
        reset(profileData)
    } else if (userInputList[0] === "gmaxword") {
        if (!isNaN(userInputList[1])) {
            profileData.maxCount = userInputList[1]
            await profileData.save()
            channelMessage = `Số lượng từ tối đa đã được chỉnh thành ${profileData.maxCount}`
        } else {
            channelMessage = 'Xin hãy nhập đúng lệnh `gsetmaxword <số lượng từ tối đa>`'
        }
    } else if (userInputList[0] === 'gdef') {
        showDefinitionMessage(message, userInputList[1])
    } else if (userInputList[0] === 'grequest') {
        const textToAdd = message.content.substring('grequest'.length).trim()
        if (textToAdd.length > 0) {
            addTextToFile(textToAdd, 'src/text/request.txt')
            channelMessage = `<@${maikaID}> sẽ kiểm tra yêu cầu của bạn và báo bạn sau nha`
        } else {
            channelMessage = `Hãy nhập đúng lệnh \`grequest <yêu cầu của bạn>\``
        }
    } else if (message.channelId === profileData.channelId && !wordsNotCheck.has(word) && isCheckingWord(word, lastMessageTimestamps, typingThreshold, message)) {
        let currentPlayer = message.author.username
        console.log("Checking used words", !profileData.usedWords.has(word))
        if (!isPreviousPlayer(currentPlayer, profileData) && dictionary.has(word) && !profileData.usedWords.has(word) && isCorrectStartingLetter(word, profileData)) {
            message.react('✅')
            profileData.usedWords.add(word)
            profileData.previousWord = word
            profileData.previousPlayer = currentPlayer
            profileData.wordCount = profileData.wordCount + 1

            await profileData.save()

            if (profileData.wordCount === profileData.maxCount) {
                reset(profileData)
                channelMessage = 'Đã đặt số lượng từ tối đa, trò chơi sẽ được làm mới'
            }
        } else {
            if (isPreviousPlayer(currentPlayer, profileData)) {
                channelMessage = 'Bình tĩnh bạn ơi. Bạn đã nối từ trước đó, hãy để những bạn khác nối nữa nha'
                 message.react('❌')
            } else if (profileData.usedWords.has(word)) {
                channelMessage = `Chữ \`${message.content}\` đã được nối trước đó. Xin hãy nối lại từ khác`
                 message.react('❌')
            } else if (!isCorrectStartingLetter(word, profileData)) {
                channelMessage = `Từ của bạn phải bắt đầu bằng chữ cái ${profileData.previousWord[profileData.previousWord.length - 1]}`
                 message.react('❌')
            } else {
                const data = await getDefinitionsFromWordsAPI(word)

                if (data.hasOwnProperty('definitions')) {
                    message.react('✅')
                    dictionary.add(word)
                    addTextToFile(word, 'src/text/dictionary.txt')
                } else {
                    channelMessage = `Từ \`${message.content}\` không có trong từ điển.\nNếu bạn chắc chắn từ đó có trong từ điển, xin hãy dùng lệnh \`grequest <yêu cầu>\`. Vd: \`grequest add ${message.content}\`\Nếu bạn không muốn bot check từ đó nữa, bạn có thể nhập \`grequest remove ${message.content}`
                }              
            }
        }
    }

    return channelMessage
}

exports.playWordChain = playWordChain