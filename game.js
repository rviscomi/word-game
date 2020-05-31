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
    this.ui.renderLetters(this.letters);
    this.ui.handleGuess = this.checkGuess.bind(this);
    this.ui.handleHint = this.getHint.bind(this);
    this.ui.handleShuffle = this.shuffle.bind(this);

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
      return letters.toLowerCase();
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
    if (this.guesses.has(guess)) {
      this.ui.setToast(GameUI.Message.REPEAT_GUESS);
    } else if (guess.length < 4) {
      this.ui.setToast(GameUI.Message.SHORT_GUESS);
    } else if (this.solution.has(guess)) {
      this.setCorrect(guess);
    } else if (!guess.includes(this.letters[0])) {
      this.ui.setToast(GameUI.Message.CENTER_LETTER);
    } else {
      this.ui.setToast(GameUI.Message.INCORRECT);
    }

    this.ui.clearGuess();
  }

  setCorrect(guess) {
    let message = GameUI.Message.CORRECT;
    this.guesses.add(guess);

    if (this.guesses.size === this.solution.size) {
      message = GameUI.Message.WIN;
    } else if (new Set(guess).size >= 7) {
      message = GameUI.Message.PANGRAM;
    }

    this.ui.setToast(message);
    this.ui.insertGuess(guess);

    this.stats.foundWord = guess;
    this.stats.foundWords = this.guesses;
  }

  getHint() {
    // Get random unguessed word.
    const hints = Array.from(this.solution).filter(hint => !this.guesses.has(hint));
    const hint = hints[Math.floor(Math.random() * hints.length)];
    // Take random substring of hint.
    const percent = Math.random() * 100;
    const letters = 3;
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
    this.ui.setToast(`${hint.length} letters`)
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
    this.letters = letters.join('');
    this.ui.renderLetters(this.letters);
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
  }

  init() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
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

    document.body.addEventListener('click', e => {
      requestAnimationFrame(() => this.guess.focus());
    });

    this.hint.addEventListener('click', e => {
      this.handleHintClick();
    });

    this.shuffle.addEventListener('click', e => {
      this.handleShuffleClick();
    });

    this.guess.focus();
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

  insertGuess(guess) {
    const element = document.createElement('div');
    element.innerText = guess;
    element.classList.add('guess');

    const guesses = this.guesses.children;
    for (let i = 0; i < guesses.length; i++) {
      const child = guesses[i];
      if (child.textContent > guess) {
        this.guesses.insertBefore(element, child);
        return;
      }
    }

    this.guesses.appendChild(element);
  }

  clearGuess() {
    this.guess.value = '';
  }

  setToast(message) {
    this.toast.innerText = message;
    this.toast.classList.remove('hidden');
    clearTimeout(this.setToast.timeout);

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
}
