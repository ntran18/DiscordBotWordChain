const fs = require("fs");
const path = require("path");
const {
    getDefinitionsFromWordsAPI,
    getDefinitionsAndExamplesFromLinguaRobot,
} = require("../api/definition");
const { gameMessages } = require("../ui/game");

const dataDir = path.join(__dirname, "data");
const baseDictionaryPath = path.join(dataDir, "dictionary.txt");
const wordsNotCheckPath = path.join(dataDir, "wordsNotCheck.txt");
const additionsPath = path.join(dataDir, "user-words.txt");

let dictionary = null;
let wordsNotCheck = null;
const lastMessageTimestamps = new Map();

/**
 * Ensure game data directories and files exist.
 */
function ensureGameDataFiles() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(additionsPath)) {
        fs.writeFileSync(additionsPath, "");
    }
}

/**
 * Load a word list file into a Set.
 * @param {string} filePath
 * @returns {Set<string>}
 */
function loadWordSet(filePath) {
    if (!fs.existsSync(filePath)) return new Set();
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    return new Set(lines);
}

/**
 * Load dictionary and words-not-check sets.
 */
function loadWordLists() {
    const baseDictionary = loadWordSet(baseDictionaryPath);
    const additionsDictionary = loadWordSet(additionsPath);
    dictionary = new Set([...baseDictionary, ...additionsDictionary]);
    wordsNotCheck = loadWordSet(wordsNotCheckPath);
}

/**
 * Ensure dictionary is loaded before access.
 */
function ensureLoaded() {
    if (!dictionary || !wordsNotCheck) {
        ensureGameDataFiles();
        loadWordLists();
    }
}

/**
 * Get dictionary set.
 * @returns {Set<string>}
 */
function getDictionary() {
    ensureLoaded();
    return dictionary;
}

/**
 * Get words-not-check set.
 * @returns {Set<string>}
 */
function getWordsNotCheck() {
    ensureLoaded();
    return wordsNotCheck;
}

/**
 * Append a new word to the additions file and in-memory dictionary.
 * @param {string} word
 */
function addNewWordToDictionary(word) {
    ensureLoaded();
    if (dictionary.has(word)) return;
    dictionary.add(word);
    fs.appendFileSync(additionsPath, `${word}\n`);
}

/**
 * Reset the game state.
 * @param {any} profile
 * @param {{ stop?: boolean }} [options]
 */
async function resetGame(profile, options = {}) {
    profile.usedWords = [];
    profile.wordCount = 0;
    profile.previousPlayer = "";
    profile.previousWord = "";
    if (options.stop) {
        profile.gameStart = false;
    }
    await profile.save();
}

function getRandomElement(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function isCorrectStartingLetter(currentWord, profile) {
    if (profile.wordCount === 0) return true;
    const { previousWord } = profile;
    return currentWord[0] === previousWord[previousWord.length - 1];
}

function isPreviousPlayer(currentPlayer, profile) {
    if (profile.wordCount === 0) return false;
    return currentPlayer === profile.previousPlayer;
}

function typeTooFast(message, typingThresholdMs) {
    if (lastMessageTimestamps.has(message.author.id)) {
        const lastTimestamp = lastMessageTimestamps.get(message.author.id);
        if (Date.now() - lastTimestamp < typingThresholdMs) {
            message.channel.send(getRandomElement(gameMessages.tooFast));
            return true;
        }
    }
    return false;
}

function isCheckingWord(word, message, typingThresholdMs) {
    if (typeTooFast(message, typingThresholdMs)) return false;
    lastMessageTimestamps.set(message.author.id, Date.now());
    return word.split(" ").length === 1 && /^[a-zA-Z\s-]+$/.test(word);
}

/**
 * Process a word-chain message. Returns a channel message to send (if any).
 * @param {import("discord.js").Message} message
 * @param {any} profile
 * @param {any} settings
 * @returns {Promise<string|null>}
 */
async function handleWordChainMessage(message, profile, settings) {
    ensureLoaded();

    if (!profile.gameStart) return null;
    if (message.channelId !== profile.channelId) return null;

    const word = message.content.toLowerCase().trim();
    if (wordsNotCheck.has(word)) return null;

    const typingThresholdMs = settings?.typingThresholdMs ?? 2000;
    if (!isCheckingWord(word, message, typingThresholdMs)) return null;

    const currentPlayer = message.author.username;

    if (isPreviousPlayer(currentPlayer, profile)) {
        message.react("❌");
        return getRandomElement(gameMessages.previousPlayer);
    }

    if (profile.usedWords.includes(word)) {
        message.react("❌");
        return getRandomElement(gameMessages.existedWord).replace(
            "message",
            word,
        );
    }

    if (!isCorrectStartingLetter(word, profile)) {
        message.react("❌");
        return getRandomElement(gameMessages.incorrectPrefix).replace(
            "letter",
            profile.previousWord[profile.previousWord.length - 1],
        );
    }

    if (!dictionary.has(word)) {
        let data = await getDefinitionsFromWordsAPI(word);
        if (data?.definitions) {
            addNewWordToDictionary(word);
        } else {
            data = await getDefinitionsAndExamplesFromLinguaRobot(word);
            if (data?.entries?.length > 0) {
                addNewWordToDictionary(word);
            } else {
                message.react("❌");
                return getRandomElement(gameMessages.notAnEnglishWord).replace(
                    "message",
                    word,
                );
            }
        }
    }

    message.react("✅");
    profile.usedWords.push(word);
    profile.previousWord = word;
    profile.previousPlayer = currentPlayer;
    profile.wordCount += 1;
    await profile.save();

    if (profile.wordCount >= profile.maxCount) {
        await resetGame(profile, { stop: false });
        return getRandomElement(gameMessages.reachMaxWords);
    }

    return null;
}

module.exports = {
    ensureGameDataFiles,
    getDictionary,
    getWordsNotCheck,
    addNewWordToDictionary,
    resetGame,
    handleWordChainMessage,
};
