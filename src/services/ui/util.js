const { EmbedBuilder } = require("discord.js");

const utilMessages = {
    helpTitle: "Danh sách lệnh",
    helpDescription: "Các lệnh khả dụng:",
    requestReceived:
        "Đã ghi nhận yêu cầu của bạn. Chủ bot sẽ xem xét sớm nhất.",
    defNotFound: "Từ đó không có trong từ điển của bot.",
};

function addField(name, value) {
    return { name, value };
}

function definitionsAndExamples(lexemes, definitionMessage) {
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
            if (
                sense?.context?.domains &&
                Array.isArray(sense.context.domains)
            ) {
                hasDomains = true;
                let domains = "[";
                sense.context.domains.forEach(
                    (domain) => (domains += `*${domain}*, `),
                );
                definitions += `${numDef}. ${domains.slice(
                    0,
                    domains.length - 2,
                )}] `;
            }
            if (
                sense.definition &&
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
            if (sense?.usageExamples) {
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
            definitionMessage.addFields(addField("Định nghĩa:", definitions));
        } else {
            definitionMessage.addFields(addField("\u200b", definitions));
        }
    });

    if (examples === "") {
        examples = "\u200b";
    }
    definitionMessage.addFields(addField("Ví dụ", examples));
}

/**
 * Build definition embed.
 * @param {string} word
 * @param {any} data
 * @returns {EmbedBuilder}
 */
function buildDefinitionEmbed(word, data) {
    const lexemes = data.entries[0].lexemes;
    const definitionMessage = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(word);
    definitionsAndExamples(lexemes, definitionMessage);
    return definitionMessage;
}

module.exports = { utilMessages, buildDefinitionEmbed };
