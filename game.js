export default class Game {
  constructor(difficulty, letters) {
    this.ui = new UI();
    this.difficulty = difficulty || 'easy';
    this.letters = letters;
    this.solution = null;
    this.guesses = new Set();
    this.loadPuzzles().then(puzzles => {
      this.puzzles = puzzles;
      this.init();
    });
  }

  init() {
    if (this.letters) {
      this.solution = new Set(this.puzzles[this.letters]);

      if (!this.solution) {
        throw `${this.difficulty} puzzle does not have letters ${this.letters}`;
      }
    } else {
      this.letters = this.getLetters();
      this.solution = new Set(this.puzzles[this.letters]);
    }

    this.ui.init();
    this.ui.renderLetters(this.letters);
    this.ui.updateProgress(this.guesses.size, this.solution.size);
    this.ui.handleGuess = this.checkGuess.bind(this);
  }

  loadPuzzles() {
    return fetch(`${this.difficulty}.json`).then(r => r.json());
  }

  getLetters() {
    const candidates = Object.keys(this.puzzles);
    const i = Math.floor(Math.random() * candidates.length);
    return candidates[i];
  }

  checkGuess(guess) {
    if (this.guesses.has(guess)) {
      this.ui.setToast(UI.Message.REPEAT_GUESS);
    } else if (guess.length < 4) {
      this.ui.setToast(UI.Message.SHORT_GUESS);
    } else if (this.solution.has(guess)) {
      this.setCorrect(guess);
    } else if (!guess.includes(this.letters[0])) {
      this.ui.setToast(UI.Message.CENTER_LETTER);
    } else {
      this.ui.setToast(UI.Message.INCORRECT);
    }

    this.ui.updateProgress(this.guesses.size, this.solution.size);
    this.ui.clearGuess();
  }

  setCorrect(guess) {
    let message = UI.Message.CORRECT;
    this.guesses.add(guess);

    if (this.guesses.size === this.solution.size) {
      message = UI.Message.WIN;
    } else if (new Set(guess).size >= 7) {
      message = UI.Message.PANGRAM;
    }

    this.ui.setToast(message);
    this.ui.insertGuess(guess);
  }

  setIncorrect() {
    this.ui.setIncorrect();
  }
}

class UI {
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
    this.letters = this.getEl('letters');
    this.guess = this.getEl('guess');
    this.form = this.getEl('guess-form');
    this.toast = this.getEl('toast');
    this.progress = this.getEl('progress');
    this.guesses = this.getEl('guesses');
  }

  init() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      if (!this.handleGuess) {
        throw `Unhandled guess`;
      }
      const guess = this.guess.value.toLowerCase();
      this.handleGuess(guess);
    });
    document.body.addEventListener('click', e => {
      requestAnimationFrame(() => this.guess.focus());
    });
    this.guess.focus();
  }

  getEl(id) {
    const element = document.getElementById(id);

    if (!element) {
      throw `Element "${id}" not found`;
    }

    return element;
  }

  getFrag() {
    return document.createDocumentFragment();
  }

  renderLetters(letters) {
    // Top row, base letter, bottom row.
    const letterSequence = [1, 2, 3, 0, 4, 5, 6];
    const fragment = this.getFrag();
    for (let i of letterSequence) {
      const letter = letters[i];
      const isBase = i === 0;
      const letterElement = this.getLetter(letter, isBase);
      fragment.appendChild(letterElement);
    }
    this.letters.appendChild(fragment);
  }

  getLetter(letter, isBase) {
    const element = document.createElement('button');
    element.innerText = letter.toUpperCase();
    element.classList.add('letter');
    element.classList.toggle('base', isBase);
    return element;
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

  updateProgress(guesses, solution) {
    this.progress.innerText = `Found ${guesses} of ${solution} words`;
  }

  setToast(message) {
    this.toast.innerText = message;
    this.toast.classList.remove('hidden');
    clearTimeout(this.setToast.timeout);

    this.setToast.timeout = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 1000);
  }
}