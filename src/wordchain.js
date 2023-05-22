const {
    getDefinitionsFromWordsAPI,
    getDefinitionsAndExamplesFromLinguaRobot,
} = require("./api/definition.js");
const { showDefinitionMessage } = require("./events/getDef.js");
const { sendHelpMessage } = require("./events/help.js");
const { reset } = require("./events/reset.js");
const { request } = require("./events/request.js");

const { EmbedBuilder } = require("discord.js");
const fs = require("fs");

// Bot messsage
const messageDisplay = {
    previousPlayer: [
        "Từ từ coi, sao nối quài dọ",
        "Whoa whoa calm down, việc đâu còn có đó, đợi một xíu đi nà",
    ],
    tooFast: [
        "Bạn đang gõ quá nhanh. Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo",
    ],
    reachMaxWords: ["Đã đạt số lượng từ tối đa, trò chơi sẽ được làm mới"],
    existedWord: ["Chữ message đã được nối trước đó. Xin hãy nối lại từ khác"],
    notAnEnglishWord: ["Từ message không có trong từ điển của bot."],
    incorrectPrefix: ["Yêu lại từ đầu nò. Từ đầu phải là letter chứ."],
    incorrectCommand: "Hãy nhập đúng lệnh command",
};

// ================================= HELPER FUNCTIONS =================================
function isCheckingWord(
    string,
    lastMessageTimestamps,
    typingThreshold,
    message
) {
    // Check if user type too fast
    if (typeTooFast(lastMessageTimestamps, message, typingThreshold)) {
        return false;
    }
    lastMessageTimestamps.set(message.author.id, Date.now());
    return string.split(" ").length == 1 && /^[a-zA-Z\s-]+$/.test(string);
}

function typeTooFast(lastMessageTimestamps, message, typingThreshold) {
    if (lastMessageTimestamps.has(message.author.id)) {
        const lastTimestamp = lastMessageTimestamps.get(message.author.id);

        if (Date.now() - lastTimestamp < typingThreshold) {
            message.channel.send(
                "Bạn đang gõ quá nhanh. Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo"
            );
            return true;
        }
    }
    return false;
}

// Check whether or not the bot follow the game rule
function isCorrectStartingLetter(currentWord, profileData) {
    // Base case
    if (profileData.wordCount === 0) {
        return true;
    }

    const { previousWord } = profileData;
    return currentWord[0] === previousWord[previousWord.length - 1];
}

function isPreviousPlayer(currentPlayer, profileData) {
    // Base case
    if (profileData.wordCount === 0) {
        return false;
    }

    const { previousPlayer } = profileData;
    return currentPlayer === previousPlayer;
}

function getRandomElements(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function addTextToFile(text, filePath) {
    fs.appendFile(filePath, text + "\n", (err) => {
        if (err) {
            console.log("Error appending text to file:", err);
        } else {
            console.log("Text added to file successfully");
        }
    });
}

function addNewWordToDictionary(message, dictionary) {
    message.react("✅");
    dictionary.add(word);
    addTextToFile(word, "src/text/dictionary.txt");
}

// ================================= PLAYING WORD CHAIN =================================
const playWordChain = async function (
    client,
    userInputList,
    dictionary,
    wordsNotCheck,
    message,
    profileData,
    lastMessageTimestamps,
    typingThreshold
) {
    const word = message.content.toLowerCase().trim();
    let channelMessage = "";

    if (userInputList[0] === "ghelp") {
        sendHelpMessage(message, client);
    } else if (word === "greset") {
        reset(profileData);
        channelMessage = "Game đã được reset";
    } else if (userInputList[0] === "gmaxword") {
        if (!isNaN(userInputList[1])) {
            profileData.maxCount = userInputList[1];
            await profileData.save();
            channelMessage = `Số lượng từ tối đa đã được chỉnh thành ${profileData.maxCount}`;
        } else {
            channelMessage = messageDisplay.incorrectCommand.replace(
                "command",
                "`gmaxword <số lượng từ tối đa>`"
            );
        }
    } else if (userInputList[0] === "gdef") {
        showDefinitionMessage(message, userInputList[1]);
    } else if (userInputList[0] === "grequest") {
        channelMessage = request(message, messageDisplay);
    } else if (
        message.channelId === profileData.channelId &&
        !wordsNotCheck.has(word) &&
        isCheckingWord(word, lastMessageTimestamps, typingThreshold, message)
    ) {
        let currentPlayer = message.author.username;
        if (
            !isPreviousPlayer(currentPlayer, profileData) &&
            dictionary.has(word) &&
            !profileData.usedWords.has(word) &&
            isCorrectStartingLetter(word, profileData)
        ) {
            message.react("✅");
            profileData.usedWords.add(word);
            profileData.previousWord = word;
            profileData.previousPlayer = currentPlayer;
            profileData.wordCount = profileData.wordCount + 1;

            await profileData.save();

            if (profileData.wordCount === profileData.maxCount) {
                reset(profileData);
                channelMessage = getRandomElements(
                    messageDisplay.reachMaxWords
                );
            }
        } else {
            if (isPreviousPlayer(currentPlayer, profileData)) {
                channelMessage = getRandomElements(
                    messageDisplay.previousPlayer
                );
                message.react("❌");
            } else if (profileData.usedWords.has(word)) {
                channelMessage = getRandomElements(
                    messageDisplay.existedWord
                ).replace("message", word);
                message.react("❌");
            } else if (!isCorrectStartingLetter(word, profileData)) {
                channelMessage = getRandomElements(
                    messageDisplay.incorrectPrefix
                ).replace(
                    "letter",
                    profileData.previousWord[
                        profileData.previousWord.length - 1
                    ]
                );
                message.react("❌");
            } else {
                let data = await getDefinitionsFromWordsAPI(word);

                if (data.hasOwnProperty("definitions")) {
                    addNewWordToDictionary(message, dictionary);
                } else {
                    data = await getDefinitionsAndExamplesFromLinguaRobot(word);
                    if (data.entries.length > 0) {
                        addNewWordToDictionary(message, dictionary);
                    } else {
                        channelMessage = getRandomElements(
                            messageDisplay.notAnEnglishWord
                        ).replace("message", word);
                    }
                }
            }
        }
    }

    return channelMessage;
};

exports.playWordChain = playWordChain;
exports.addTextToFile = addTextToFile;
