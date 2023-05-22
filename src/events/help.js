const { EmbedBuilder } = require("discord.js");
const maikaID = "712551540597981224";

const sendHelpMessage = (message, client) => {
    const helpMessage = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
            name: "Command List",
            iconURL: message.author.displayAvatarURL(),
            url: "https://discord.js.org",
        })
        .setDescription(
            `Danh sách lệnh của **${client.user.username}** \nCần sự giúp đỡ nhiều hơn? Tag <@${maikaID}> `
        )
        .addFields(
            {
                name: "Bắt đầu trò chơi",
                value: "`gwordchain <kênh chat bạn muốn bắt đầu>`",
            },
            { name: "Định nghĩa", value: "`gdef <từ cần định nghĩa>`" },
            { name: "Làm mới trò chơi", value: "`greset`" },
            {
                name: "Cài đặt số lượng từ tối đa",
                value: "`gmaxword <số lượng từ tối đa>`",
            },
            { name: "Yêu cầu", value: "`grequest <yêu cầu của bạn>`" }
        );
    message.channel.send({ embeds: [helpMessage] });
};

exports.sendHelpMessage = sendHelpMessage;
