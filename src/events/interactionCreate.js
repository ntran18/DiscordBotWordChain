const { Events, PermissionFlagsBits, Collection } = require("discord.js");
const { common } = require("../services/ui/common");

// Khởi tạo Map để lưu trữ cooldowns bên ngoài module.exports
const cooldowns = new Map();

async function safeReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    /**
     * @param {import("discord.js").Interaction} interaction
     */
    async execute(interaction) {
        try {
            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commandMap.get(
                interaction.commandName,
            );
            if (!command) return;

            if (!cooldowns.has(command.name)) {
                cooldowns.set(command.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const defaultCooldownDuration = 3; // Mặc định 3 giây nếu command không định nghĩa
            const cooldownAmount =
                (command.cooldown || defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime =
                    timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return safeReply(interaction, {
                        content: `⚠️ Vui lòng đợi. Bạn có thể sử dụng lại lệnh này <t:${expiredTimestamp}:R>.`,
                        ephemeral: true,
                    });
                }
            }
            // -----------------------
            if (command.ownerOnly) {
                const ownerId = interaction.client.ownerId;
                if (!ownerId || interaction.user.id !== ownerId) {
                    return safeReply(interaction, {
                        content: common.ownerOnly,
                        ephemeral: true,
                    });
                }
            }

            if (command.adminOnly) {
                const isAdmin = interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator,
                );
                if (!isAdmin) {
                    return safeReply(interaction, {
                        content: common.noPermission,
                        ephemeral: true,
                    });
                }
            }

            await command.execute(interaction);
            timestamps.set(interaction.user.id, now);
            setTimeout(
                () => timestamps.delete(interaction.user.id),
                cooldownAmount,
            );
        } catch (err) {
            console.error("interactionCreate error:", err);
            return safeReply(interaction, {
                content: common.genericError,
                ephemeral: true,
            });
        }
    },
};
