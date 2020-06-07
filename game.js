import Stats from './stats.js';
import UI from './ui.js';

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

    this.stats.init();
    this.stats.foundWords = this.guesses;
    this.stats.totalWordCount = this.solution.size;
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

  checkGuess(guess) {
    guess = guess.toLowerCase();
    if (guess === 'h') {
      this.getHint();
      return;
    } else if (guess === 's') {
      this.shuffle();
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
    const isPangram = new Set(guess).size >= 7;
    let message = GameUI.Message.CORRECT;

    this.stats.foundWords = this.guesses;
    this.stats.foundWord = guess;
    this.guesses.add(guess);
    this.ui.insertGuess(guess, isPangram ? 'pangram' : null);

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
    this.guesses = this.solution;
    this.ui.setToast(GameUI.Message.WIN, 'magic');
    this.ui.revealSolution(this.solution, this.guesses);
    this.stats.foundWords = this.solution;
    this.stats.countHint(this.solution.size - this.guesses.size);
  }
}

class GameUI {
  static Message = {
    REPEAT_GUESS: 'Already guessed',
    SHORT_GUESS: 'Words must be at least 4 letters',
    CENTER_LETTER: 'Words must contain the center letter',
    INCORRECT: 'Unrecognized word',
    CORRECT: 'Correct!',
    PANGRAM: 'PANGRAM!',
    WIN: 'YOU WIN!!'
  };

  constructor() {
    this.letters = UI.getEl('letters');
    this.guess = UI.getEl('guess');
    this.form = UI.getEl('guess-form');
    this.toast = UI.getEl('toast');
    this.guesses = UI.getEl('guesses');
    this.hint = UI.getEl('hint');
    this.shuffle = UI.getEl('shuffle');
    this.enter = UI.getEl('enter');
  }

  init() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      this.handleFormSubmit();
    });
    this.enter.addEventListener('click', e => {
      this.handleFormSubmit();
    });

    this.guess.addEventListener('keydown', e => {
      const letterId = `letter-${e.key.toLowerCase()}`;
      this.setLetterActivity(letterId, true);
    });
    this.guess.addEventListener('keyup', e => {
      const letterId = `letter-${e.key.toLowerCase()}`;
      this.setLetterActivity(letterId, false);
    });

    if (!this.isMobile()) {
      document.body.addEventListener('click', e => {
        requestAnimationFrame(() => this.guess.focus());
      });
    }

    this.hint.addEventListener('click', e => {
      this.handleHintClick();
    });

    this.shuffle.addEventListener('click', e => {
      this.handleShuffleClick();
    });

    this.guess.focus();
  }

  isMobile() {
    return matchMedia('(max-width: 900px)').matches;
  }

  handleFormSubmit() {
    if (!this.handleGuess) {
      throw `Unhandled guess`;
    }
    const guess = this.guess.value.toLowerCase();
    this.handleGuess(guess);
  }

  setLetterActivity(id, force) {
    try {
      const el = UI.getEl(id);
      el.classList.toggle('active', force);
    } catch (e) {
      return;
    }
  }

  handleHintClick() {
    if (!this.handleHint) {
      throw `Unhandled hint`;
    }
    this.handleHint();
  }

  handleShuffleClick() {
    if (!this.handleShuffle) {
      throw `Unhandled shuffle`;
    }
    this.handleShuffle();
  }

  renderLetters(letters) {
    // Top row, base letter, bottom row.
    const letterSequence = [1, 2, 3, 0, 4, 5, 6];
    const fragment = UI.getFrag();
    for (let i of letterSequence) {
      const letter = letters[i];
      const isBase = i === 0;
      const letterElement = this.getLetter(letter, isBase);
      fragment.appendChild(letterElement);
    }
    this.letters.innerHTML = '';
    this.letters.appendChild(fragment);
  }

  getLetter(letter, isBase) {
    const element = document.createElement('button');
    element.id = `letter-${letter}`;
    element.innerText = letter.toUpperCase();
    element.classList.add('letter');
    element.classList.toggle('base', isBase);
    element.addEventListener('click', e => {
      this.addLetter(letter);
    });
    return element;
  }

  addLetter(letter) {
    // Splice a letter into the guess at the caret position.
    const letters = Array.from(this.guess.value);
    const start = this.guess.selectionStart;
    const end = this.guess.selectionEnd;
    const deleteCount = Math.abs(end - start);
    letters.splice(start, deleteCount, letter);
    this.guess.value = letters.join('');
    requestAnimationFrame(() => {
      this.guess.setSelectionRange(start + 1, start + 1);
    });
  }

  insertGuess(guess, className) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('guess-wrapper');
    const element = document.createElement('span');
    wrapper.appendChild(element);

    element.innerText = guess;
    element.classList.add('guess');
    if (className) {
      element.classList.add(className);
    }

    const guesses = this.guesses.children;
    for (let i = 0; i < guesses.length; i++) {
      const child = guesses[i];
      if (child.textContent > guess) {
        this.guesses.insertBefore(wrapper, child);
        return;
      }
    }

    this.guesses.appendChild(wrapper);
  }

  clearGuess() {
    this.guess.value = '';
  }

  setToast(message, className) {
    this.toast.innerText = message;
    this.toast.classList.remove('hidden', 'good', 'bad', 'magic');
    this.toast.classList.add(className);
    clearTimeout(this.setToast.timeout);

    if (message == GameUI.Message.WIN) {
      return;
    }

    this.setToast.timeout = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 1000);
  }

  showHint(hint) {
    this.guess.value = hint;
    requestAnimationFrame(() => {
      this.guess.setSelectionRange(hint.length, hint.length);
    });
  }

  revealSolution(solution, guesses) {
    solution.forEach(word => {
      if (guesses.has(word)) {
        return;
      }

      this.insertGuess(word, 'cheat');
    });
  }
}
