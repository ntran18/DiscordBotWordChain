const adminMessages = {
    addRoleSuccess: (botName, roleName) =>
        `✅ Đã thêm auto-role cho **${botName}**: ${roleName}`,
    removeRoleSuccess: (botName, roleName) =>
        `❌ Đã xóa auto-role cho **${botName}**: ${roleName}`,
    logChannelSet: (channelName) => `✅ Đã đặt kênh log: ${channelName}`,
    logChannelDisabled: "✅ Đã tắt log auto-role.",
    typingSet: (value) => `✅ Đã đặt thời gian chờ: ${value}ms.`,
    typingReset: (value) => `✅ Đã đặt lại thời gian chờ: ${value}ms.`,
    syncDone: (count) => `✅ Đã đồng bộ ${count} lệnh.`,
    removeUsersNoMembers: (roleName) =>
        `Không có thành viên nào có role ${roleName}.`,
    removeUsersConfirm: (roleName, total, kickable) =>
        `Bạn sắp loại ${total} thành viên có role ${roleName}. Có ${kickable} thành viên có thể bị loại (bot có quyền). Xác nhận?`,
    removeUsersCancelled: "Đã hủy thao tác.",
    removeUsersNoKickable: "Không có thành viên nào có thể bị loại.",
    removeUsersDone: (success, failed) =>
        `✅ Đã loại ${success} thành viên. Thất bại: ${failed}.`,
    removeUsersRoleNotFound: (roleName) =>
        `Không tìm thấy role tên "${roleName}".`,
    removeUsersRoleAmbiguous: (roleName, count) =>
        `Có ${count} role trùng tên "${roleName}". Vui lòng đổi tên role hoặc dùng tên duy nhất.`,
};

module.exports = { adminMessages };
