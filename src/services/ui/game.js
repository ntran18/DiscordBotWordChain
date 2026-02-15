const gameMessages = {
    previousPlayer: ["Bạn vừa chơi rồi, để người khác chơi trước nhé."],
    tooFast: [
        "Bạn đang gõ quá nhanh. Vui lòng chờ một chút trước khi gửi tin nhắn tiếp theo.",
    ],
    reachMaxWords: ["Đã đạt số lượng từ tối đa, trò chơi sẽ được làm mới."],
    existedWord: ["Từ này đã được nối trước đó. Xin hãy nối lại từ khác."],
    notAnEnglishWord: ["Từ message không có trong từ điển của bot."],
    incorrectPrefix: ["Từ mới phải bắt đầu bằng chữ cái letter."],
    gameStarted: "Bắt đầu trò chơi nối chữ tại kênh này.",
    gameStopped: "Trò chơi đã được dừng.",
    maxWordUpdated: (value) =>
        `Số lượng từ tối đa đã được chỉnh thành ${value}.`,
};

module.exports = { gameMessages };
