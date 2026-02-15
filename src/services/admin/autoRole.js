const GuildSettings = require("../../models/guildSettings");

/**
 * Assign auto-roles when a configured bot tags a user.
 * @param {import("discord.js").Message} message
 */
async function handleAutoRole(message) {
    if (!message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const botName = message.author.username;

    const userTaggedFromEmbed = message.embeds
        .map((embed) => embed.description)
        .join("\n")
        .match(/<@!?([0-9]+)>/);

    const userTaggedFromMessage = message.mentions.users.first()?.id;
    let userTaggedId = null;
    if (userTaggedFromEmbed) {
        userTaggedId = userTaggedFromEmbed[1];
    } else if (userTaggedFromMessage) {
        userTaggedId = userTaggedFromMessage;
    }

    if (!userTaggedId) return;

    const settings = await GuildSettings.findOne({ guildId });
    if (!settings?.autoRoles?.length) return;

    for (const { botName: configuredBotName, roleId } of settings.autoRoles) {
        if (botName !== configuredBotName) continue;

        const member = await message.guild.members.fetch(userTaggedId);
        if (member.roles.cache.has(roleId)) return;

        try {
            await member.roles.add(roleId);
            if (settings.logChannelId) {
                const logChannel = await message.guild.channels.fetch(
                    settings.logChannelId,
                );
                if (logChannel?.isTextBased?.()) {
                    logChannel.send(
                        `✅ Auto-role đã gán: ${member.user.tag} -> <@&${roleId}>`,
                    );
                }
            }
        } catch (err) {
            console.error("Failed to assign role:", err);
            if (err.code === 50001) {
                message.channel.send(
                    `❌ Không thể gán role <@&${roleId}> cho ${member.user.tag}. Bot có thể thiếu quyền hoặc role cao hơn role của bot.`,
                );
            } else {
                message.channel.send(
                    `❌ Lỗi khi gán role <@&${roleId}> cho ${member.user.tag}: ${err.message}`,
                );
            }
        }
    }
}

module.exports = { handleAutoRole };
