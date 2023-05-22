const { addTextToFile } = require("../wordchain.js");

const request = (message, messageDisplay) => {
    const textToAdd = message.content.substring("grequest".length).trim();

    if (textToAdd.length > 0) {
        addTextToFile(textToAdd, "src/text/request.txt");
        return `<@${maikaID}> sẽ kiểm tra yêu cầu của bạn và báo bạn sau nha`;
    }

    return messageDisplay.incorrectCommand.replace(
        "command",
        "`grequest <yêu cầu của bạn>`"
    );
};

exports.request = request;
