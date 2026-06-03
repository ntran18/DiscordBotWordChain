export async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

export async function sendBotOwnerDm(client, message) {
    const ownerId = client.ownerId;
    if (ownerId) {
        try {
            const owner = await client.users.fetch(ownerId);
            await owner.send(message);
        } catch (dmErr) {
            console.error("Failed to DM owner:", dmErr);
        }
    }
}

export async function handleCommandError(
    interaction,
    error,
    commandName,
    messageToUsers
) {
    console.log(`/${commandName} error:`, error);

    const messageToOwner = `Lỗi khi thực hiện lệnh /${commandName} trong server ${interaction.guild?.name ?? "unknown"} (${interaction.guildId}):\n${error.stack || error.message || error}`;
    await sendBotOwnerDm(interaction.client, messageToOwner);

    let messageToSend =
        messageToUsers ||
        "❌ Đã xảy ra lỗi khi thực hiện lệnh này. Vui lòng thử lại sau! Vấn đề đã được báo cáo đến đội ngũ phát triển.";
    return safeReply(interaction, {
        content: messageToSend,
        ephemeral: true,
    });
}
