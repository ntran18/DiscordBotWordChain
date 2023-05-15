// This file would not be run, only to save the process to collect dictionary
const fs = require('fs')
const dictionaryOriginal = new Set()

// Read file in wordnet.json to collect all words
const wordnetData = fs.readFileSync("src/wordnet.json", "utf-8")
const wordnet = JSON.parse(wordnetData)["synset"]
const filePath = "src/dictionary.txt"

function isNormalWord(word) {
    return /^[a-zA-Z\s-]+$/.test(word)
}

function addWordToDictionary (element) {
    if (isNormalWord(element)) {
        dictionaryOriginal.add(element)
    } else if (element.includes('_')) {
        element.split("_").forEach(w => isNormalWord(w) ? dictionaryOriginal.add(w) : console.log(w))
    } else {
        console.log(element)
    }
}

for (const key in wordnet) {
    wordnet[key]["word"].forEach(element => addWordToDictionary(element.toLowerCase()))
}

fs.writeFileSync(filePath, Array.from(dictionaryOriginal).sort().join(`\n`), (err) => {
    if (err) throw err;
    console.log("Done writing")
})
