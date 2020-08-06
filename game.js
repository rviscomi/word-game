import GameUI from './gameui.js';
import Stats from './stats.js';
import Storage from './storage.js';

export default class Game {
  constructor() {
    this.ui = new GameUI();
    this.stats = new Stats();
    this.difficulty = this.getDifficulty();
    this.letters = null;
    this.solution = null;
    this.guesses = new Set();
    this.loadPuzzles().then(puzzles => {
      this.puzzles = puzzles;
      this.init();
    });
  }

  init() {
    this.letters = this.getLetters();
    this.solution = this.getSolution();

    this.ui.init();
    this.shuffle();
    this.ui.handleGuess = this.checkGuess.bind(this);
    this.ui.handleHint = this.getHint.bind(this);
    this.ui.handleShuffle = this.shuffle.bind(this);

    this.storage = new Storage(this.letters);
    const guesses = this.storage.getGuesses().forEach(({guess, classNames}) => {
      this.guesses.add(guess);
      this.ui.insertGuess(guess, classNames);
    });

    this.stats.init();
    this.stats.totalWordCount = this.solution.size;
    this.stats.foundWords = this.guesses;
    this.stats.maxPoints = this.stats.getTotalPoints(this.solution);
    this.stats.toggleStats(this.getParam('stats') === null);
  }

  loadPuzzles() {
    return fetch(`${this.difficulty}.json`).then(r => r.json());
  }

  getDifficulty() {
    return this.getParam('difficulty') || 'easy';
  }

  getLetters() {
    let letters = this.getParam('letters');
    if (letters) {
      return letters[0] + Array.from(letters.toLowerCase()).slice(1).sort().join('');
    }

    const candidates = Object.keys(this.puzzles);
    const i = Math.floor(Math.random() * candidates.length);
    return candidates[i];
  }

  getSolution() {
    if (!(this.letters in this.puzzles)) {
      throw `${this.difficulty} puzzle does not have letters ${this.letters}`;
    }

    return new Set(this.puzzles[this.letters]);
  }

  getParam(key) {
    const url = new URL(location.href);
    return url.searchParams.get(key);
  }

  setParam(key, value) {
    const url = new URL(location.href);
    const oldUrl = url.href;
    url.searchParams.set(key, value);
    const newUrl = url.href;

    if (oldUrl != newUrl) {
      history.pushState(null, null, newUrl);
    }
  }

  checkGuess(guess) {
    guess = guess.toLowerCase();
    if (guess === 'h') {
      this.getHint();
      return;
    } else if (guess === 's' || guess === ' ') {
      this.shuffle();
    } else if (guess === 'f') {
      this.ui.toggleFullscreen();
    } else if (guess === 'l') {
      this.setParam('letters', this.letters);
    } else if (guess === 'konami code') {
      this.cheat();
    } else if (this.guesses.has(guess)) {
      this.ui.setToast(GameUI.Message.REPEAT_GUESS, 'bad');
    } else if (guess.length < 4) {
      this.ui.setToast(GameUI.Message.SHORT_GUESS, 'bad');
    } else if (this.solution.has(guess)) {
      this.setCorrect(guess);
    } else if (!guess.includes(this.letters[0])) {
      this.ui.setToast(GameUI.Message.CENTER_LETTER, 'bad');
    } else {
      this.ui.setToast(GameUI.Message.INCORRECT, 'bad');
    }

    this.ui.clearGuess();
  }

  setCorrect(guess) {
    const isPangram = this.stats.isPangram(guess);
    let message = GameUI.Message.CORRECT;
    const className = isPangram ? 'pangram' : null;

    this.guesses.add(guess);
    this.stats.foundWords = this.guesses;
    this.stats.foundWord = guess;
    this.ui.insertGuess(guess, className)
    this.storage.addGuess(guess, className);

    if (this.guesses.size === this.solution.size) {
      this.setGameOver();
      return;
    }

    if (isPangram) {
      message = GameUI.Message.PANGRAM;
    }

    this.ui.setToast(message, 'good');
  }

  setGameOver() {
    this.ui.setToast(GameUI.Message.WIN, 'good');
    this.stats.clearTimer();
  }

  getHint() {
    // Get random unguessed word.
    const hints = Array.from(this.solution).filter(hint => !this.guesses.has(hint));
    const hint = hints[Math.floor(Math.random() * hints.length)];
    // Take random substring of hint.
    const percent = Math.random() * 100;
    let letters = 3;
    if (percent < 0.1) {
      letters = hint.length;
    } else if (percent < 1) {
      letters = 7;
    } else if (percent < 5) {
      letters = 5;
    }
    const partialHint = hint.substring(0, letters);
    // Show hint.
    this.ui.showHint(partialHint);
    this.ui.setToast(`${hint.length} letters`, 'magic')
    this.stats.countHint();
  }

  shuffle() {
    let letters = Array.from(this.letters);
    for (let i = 1; i < letters.length; i++) {
      const j = Math.floor(Math.random() * (letters.length - i)) + i;
      const temp = letters[i];
      letters[i] = letters[j];
      letters[j] = temp;
    }

    this.ui.renderLetters(letters.join(''));
  }

  cheat() {
    this.ui.setToast(GameUI.Message.WIN, 'magic');
    this.stats.foundWords = this.solution;
    this.stats.countHint(this.solution.size - this.guesses.size);


    this.solution.forEach(word => {
      if (this.guesses.has(word)) {
        return;
      }

      let classNames = 'magic';

      if (this.stats.isPangram(word)) {
        classNames += ' pangram';
      }

      this.ui.insertGuess(word, classNames);
      this.storage.addGuess(word, classNames);
    });

    this.guesses = this.solution;
  }
}