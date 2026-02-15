require("dotenv").config();
const fetch = require("node-fetch");

/**
 * Fetch definitions from Words API.
 * @param {string} word
 * @returns {Promise<any>}
 */
const getDefinitionsFromWordsAPI = async function (word) {
    return await fetchAPI(
        `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`,
        "wordsapiv1.p.rapidapi.com",
    );
};

/**
 * Fetch definitions and examples from Lingua Robot.
 * @param {string} word
 * @returns {Promise<any>}
 */
const getDefinitionsAndExamplesFromLinguaRobot = async function (word) {
    return await fetchAPI(
        `https://lingua-robot.p.rapidapi.com/language/v1/entries/en/${word}`,
        "lingua-robot.p.rapidapi.com",
    );
};

/**
 * Helper fetch with RapidAPI headers.
 * @param {string} url
 * @param {string} rapidapiHost
 * @returns {Promise<any>}
 */
const fetchAPI = async function (url, rapidapiHost) {
    const options = {
        method: "GET",
        headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": rapidapiHost,
        },
    };

    const response = await fetch(url, options);
    return await response.json();
};

module.exports = {
    getDefinitionsFromWordsAPI,
    getDefinitionsAndExamplesFromLinguaRobot,
};
