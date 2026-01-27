const fs = require("fs");

function addTextToFile(text, filePath) {
    fs.appendFile(filePath, text + "\n", (err) => {
        if (err) {
            console.log("Error appending text to file:", err);
        } else {
            console.log("Text added to file successfully");
        }
    });
}

const request = (message, messageDisplay, maikaID) => {
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
