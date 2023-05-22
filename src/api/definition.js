require("dotenv").config();
const fetch = require("node-fetch");

// Get Definitions From Words API
const getDefinitionsFromWordsAPI = async function (word) {
    return await fetchAPI(
        `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`,
        "wordsapiv1.p.rapidapi.com"
    );
};

// Get Definitions and Examples From Lingua Robot
const getDefinitionsAndExamplesFromLinguaRobot = async function (word) {
    return await fetchAPI(
        `https://lingua-robot.p.rapidapi.com/language/v1/entries/en/${word}`,
        "lingua-robot.p.rapidapi.com"
    );
};

//  Helper function to fetch from API with different urls
const fetchAPI = async function (url, rapidapiHost) {
    const options = {
        method: "GET",
        headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": rapidapiHost,
        },
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.log(error);
    }
};

exports.getDefinitionsFromWordsAPI = getDefinitionsFromWordsAPI;
exports.getDefinitionsAndExamplesFromLinguaRobot =
    getDefinitionsAndExamplesFromLinguaRobot;
