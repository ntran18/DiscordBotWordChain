require('dotenv').config()
const fetch = require('node-fetch')

// Get Definitions From WordsAPI
const getExamples = async function(word) {
  const url = `https://twinword-word-graph-dictionary.p.rapidapi.com/example/?entry=${word}`
  return await fetchAPI(url)
}

// Get Definitions From Words API 
const getDefinitionsFromWordsAPI = async function (word) {
  const url = `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`;
  return await fetchAPI(url)
}


//  Helper function to fetch from API with different urls
const fetchAPI = async function(url) {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
    }
  }

  try {
    const response = await fetch(url, options)
    const result = await response.json()
    console.log(result)
    return result
  } catch (error) {
    console.log(error)
  } 
} 

exports.getExamples = getExamples
exports.getDefinitionsFromWordsAPI = getDefinitionsFromWordsAPI