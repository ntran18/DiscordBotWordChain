const fetch = require('node-fetch')

// Get Definitions From WordsAPI
const getExamples = async function(word) {
  const url = `https://twinword-word-graph-dictionary.p.rapidapi.com/example/?entry=${word}`
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'c49728e5c0msh0f14fc48be87329p1f5388jsn60baa23a9bd6',
      'X-RapidAPI-Host': 'twinword-word-graph-dictionary.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options)
    const result = await response.json()
    console.log(result)
    return result
  } catch (error) {
    console.log(error)
  } 
}

// Get Definitions From Words API 
const getDefinitionsFromWordsAPI = async function (word) {
  const url = `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'c49728e5c0msh0f14fc48be87329p1f5388jsn60baa23a9bd6',
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