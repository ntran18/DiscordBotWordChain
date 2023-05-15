const { getExamples, getDefinitionsFromWordsAPI } = require('./definition.js') 

function isCheckingWord (string) {
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

function showHelpMessage (message) {
    const helpMessage = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({ name: 'Command List', iconURL: message.author.displayAvatarURL(), url: 'https://discord.js.org' })
        .setDescription(`Danh sách lệnh của **${client.user.username}** \nCần sự giúp đỡ nhiều hơn? Tag **Maika** `)
        .addFields(
            { name: 'Bắt đầu trò chơi', value: '`gnoichu`'},
            { name: 'Định nghĩa', value: '`ggetdef <từ cần định nghĩa>`' },
            { name: 'Làm mới trò chơi', value: '`greset`'},
            { name: 'Cài đặt số lượng từ tối đa', value: '`setmaxword <số lượng từ tối đa>`'},
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
        message.channel.send('Xin lỗi từ vựng này không có trong từ điển tôi tìm được trên mạng, nếu bạn chắc chắn có từ này, xin hãy liên hệ với Maika')
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



const playWordChain = async function(userInputList, dictionary, message, profileData) {
    const word = message.content.toLowerCase().trim()
    let channelMessage = ""
    if (userInputList[0] === 'ghelp') {
        showHelpMessage(message)
    } else if (word === "greset") {
        reset(profileData)
    } else if (userInputList[0] === "gsetmaxword") {
        if (!isNaN(userInputList[1])) {
            profileData.maxCount = userInputList[1]
            await profileData.save()
            channelMessage = `Số lượng từ tối đa đã được chỉnh thành ${profileData.maxCount}`
        } else {
            channelMessage = 'Xin hãy nhập đúng lệnh `gsetmaxword <số lượng từ tối đa>`'
        }
    } else if (userInputList[0] === 'ggetdef') {
        showDefinitionMessage(message, userInputList[1])
    }else if (isCheckingWord(word)) {
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
            message.react('❌')
            // if the word is repeated 
            if (isPreviousPlayer(currentPlayer, profileData)) {
                channelMessage = 'Bình tĩnh bạn ơi. Bạn đã nối từ trước đó, hãy để những bạn khác nối nữa nha'
            } else if (profileData.usedWords.has(word)) {
                channelMessage = `Chữ \`${message.content}\` đã được nối trước đó. Xin hãy nối lại từ khác`
            } else if (!isCorrectStartingLetter(word, profileData)) {
                channelMessage = `Từ của bạn phải bắt đầu bằng ${previousWord[previousWord.length - 1]}`
            } else {
                channelMessage = `Từ \`${message.content}\` không có trong từ điển`                    
            }
        }
    }

    return channelMessage
}

exports.playWordChain = playWordChain