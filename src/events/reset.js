const reset = async (profileData) => {
    profileData.usedWords.clear();
    profileData.wordCount = 0;
    profileData.previousPlayer = "";
    profileData.previousWord = "";

    await profileData.save();
};

exports.reset = reset;
