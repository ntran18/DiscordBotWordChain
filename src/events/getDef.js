const {
    getDefinitionsAndExamplesFromLinguaRobot,
} = require("../api/definition.js");

const { EmbedBuilder } = require("discord.js");

function defintionsAndExamples(lexemes, definitionMessage) {
    let examples = "";
    let numLexeme = 0;

    let numEx = 0;

    lexemes.forEach((lexeme) => {
        numLexeme++;

        const partOfSpeech = lexeme.partOfSpeech;
        let definitions = `*${partOfSpeech}*\n`;

        let numDef = 1;
        let hasDomains = false;

        lexeme.senses.forEach((sense) => {
            console.log(sense);
            if (
                sense.hasOwnProperty("context") &&
                sense.context.hasOwnProperty("domains")
            ) {
                hasDomains = true;
                let domains = "[";
                sense.context.domains.forEach(
                    (domain) => (domains += `*${domain}*, `)
                );
                definitions += `${numDef}. ${domains.slice(
                    0,
                    domains.length - 2
                )}] `;
            }
            if (
                sense.hasOwnProperty("definition") &&
                definitions.length + sense.definition.length + 2 <= 1024 &&
                numDef <= 5
            ) {
                if (hasDomains) {
                    definitions += `${sense.definition}\n`;
                } else {
                    definitions += `${numDef}. ${sense.definition}\n`;
                }
                numDef++;
            }
            if (sense.hasOwnProperty("usageExamples")) {
                sense.usageExamples.forEach((ex) => {
                    numEx++;
                    const example = `${numEx}. ${ex}\n`;
                    if (examples.length + example.length <= 1024) {
                        examples += example;
                    }
                });
            }
        });

        if (numLexeme === 1) {
            definitionMessage.addFields(addField(`Định nghĩa:`, definitions));
        } else {
            definitionMessage.addFields(addField("\u200b", definitions));
        }

        definitions = "";
    });

    if (examples === "") {
        examples = "\u200b";
    }
    definitionMessage.addFields(addField("Ví dụ", examples));
}

function addField(name, value) {
    return { name: name, value: value };
}

async function showDefinitionMessage(message, word) {
    const data = await getDefinitionsAndExamplesFromLinguaRobot(word);
    if (data.entries.length > 0) {
        const lexemes = data.entries[0].lexemes;

        const definitionMessage = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(word);

        defintionsAndExamples(lexemes, definitionMessage);
        message.channel.send({ embeds: [definitionMessage] });
    } else {
        message.channel.send("Từ đó không có trong từ điển của bot");
    }
}

exports.showDefinitionMessage = showDefinitionMessage;
