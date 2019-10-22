const readline = require('readline');

const words = require('./words');

const MAX_ERRORS = 3;
const ALLOWED_INPUT = /^([0-9a-zA-Z]){1}$/;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

main();

async function main() {
  printHeader();

  let selectedLevel = await questionPromise('Please, select your level (1. Beginner | 2. Moderate | 3. Hard): ');
  selectedLevel = parseInt(selectedLevel, 10);

  game(selectedLevel);
}


/***********/
/* HELPERS */
/***********/

async function game(level) {
  const selectedWord = selectWord(words);
  const indexesToShow = selectIndexesToShow(level, selectedWord);
  
  const result = await processInput(selectedWord, indexesToShow);

  if (result === 0) {
    console.log('\033c');
    printHeader();
    await game(level);
  }
}

async function processInput(selectedWord, indexesToShow, errors = 0) {
  const formattedWord = printWord(selectedWord, indexesToShow);
  const gameOn = checkIfAllLettersAreFound(formattedWord) && errors < MAX_ERRORS;
  
  if (gameOn) {
    console.log(`\n${formattedWord}`);
    const input = await questionPromise(`Guess a letter (${MAX_ERRORS - errors} mistake${MAX_ERRORS - errors === 1 ? '' : 's'} still allowed): `);
    const guessIsCorrect = checkIfLetterIsMissing(selectedWord, indexesToShow, input)
    const inputIsInvalid = !ALLOWED_INPUT.test(input);

    if (inputIsInvalid) {
      console.log(`\n\x1b[31mWrong input! Only alphanumeric charactes are allowed.\x1b[37m\n`);
      errors += 1;
    } else if (guessIsCorrect) {
      console.log(`\n\x1b[32mCorrect! :)\x1b[37m\n`);
      indexesToShow = getNewVisibleLetters(selectedWord, indexesToShow, input);
    } else {
      console.log(`\n\x1b[31mWrong guess! :(\x1b[37m\n`);
      errors += 1;
    }

    return processInput(selectedWord, indexesToShow, errors);
  } else {
    console.log(`\n${printWord(selectedWord, [...selectedWord.split('').map((item, index) => index)], '\x1b[33m')}`);
    console.log(`\n\n\x1b[36mGame is over. You ${errors < MAX_ERRORS ? 'win' : 'lose'}!`);
    
    const input = await questionPromise(`Press (1) to play again or any other key to quit:\x1b[37m `);

    if (input !== '1') {
      process.exit(0);
    } else {
      return 0;
    }
  }
}

function printHeader() {
  console.log(`\x1b[37m\n|---------------------------------------------------------------------------------------------------|`);
  console.log(`|                                     Welcome to HANGMAN                                            |`);  
  console.log(`|---------------------------------------------------------------------------------------------------|\n`);
}

function questionPromise(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Returns a random word from the given array.
 * 
 * @param {Array} words 
 */

function selectWord(words) {
  if (!(words && words.length)) {
    throw new Error('No words provided');
  }

  const totalWordsCount = words.length;
  const randomIndex = Math.floor(totalWordsCount * Math.random());

  return words[randomIndex];
}

/**
 * Returns an array of indexes to show at the beginning of the game.
 * For level 1 -> 30% of the letters will be uncovered.
 * For level 2 -> 15% of the letters will be uncovered.
 * For level 3 -> 0% of the letter will be uncovered.
 * 
 * @param {Number} level 
 * @param {String} word 
 */

function selectIndexesToShow(level, word) {
  const indexes = [];
  let visibleIndexesCounter = 0;

  if (level === 1) {
    visibleIndexesCounter = Math.ceil(word.length * 0.3);
  } else if (level === 2) {
    visibleIndexesCounter = Math.ceil(word.length * 0.15);
  }

  let counter = 0;
  
  while (counter < visibleIndexesCounter) {
    const randomIndex = Math.floor(word.length * Math.random());

    if (!indexes.includes(randomIndex) && word.charAt(randomIndex) !== ' ') {
      indexes.push(randomIndex);
      counter += 1;
    }
  }

  return indexes;
}

/**
 * Formats the word, showing the letters for visible indexes and underscores for 
 * hidden indexes.
 * 
 * @param {String} word 
 * @param {Array} indexesToShow 
 */

function printWord(word, indexesToShow, color) {
  const wordChars = [];

  for (let i = 0; i < word.length; i += 1) {
    if (indexesToShow.includes(i) || word.charAt(i) === ' ') {
      wordChars.push(word.charAt(i));
    } else {
      wordChars.push('_');
    }
  }

  return `${color || '\x1b[35m'}Your word: ${wordChars.join(' ')}\x1b[37m`;
}

/**
 * Checks if there are still letters to be uncovered for a given word.
 * 
 * @param {String} printedWord 
 */

function checkIfAllLettersAreFound(printedWord) {
  return printedWord.includes('_');
}

/**
 * Checks for all the matches for a given character and returns the updated
 * array of visible indexes.
 * 
 * @param {String} word 
 * @param {Array} indexesToShow 
 * @param {String} input 
 */

function getNewVisibleLetters(word, indexesToShow, input) {
  for (let i = 0; i < word.length; i += 1) {
    if (word.charAt(i) === input) {
      indexesToShow.push(i);
    }
  }

  return indexesToShow;
}

/**
 * Checks if the given letter can be included on the empty spaces.
 * 
 * @param {String} word 
 * @param {Array} indexesToShow 
 * @param {String} input 
 */

function checkIfLetterIsMissing(word, indexesToShow, input) {
  const newIndexes = [...indexesToShow];
  let letterIsFound = false;

  for (let i = 0; i < word.length; i += 1) {
    if (word.charAt(i) === input && !indexesToShow.includes(i)) {
      letterIsFound = true;
      newIndexes.push(i);
    }
  }

  return (indexesToShow.length !== newIndexes.length) && letterIsFound;
}