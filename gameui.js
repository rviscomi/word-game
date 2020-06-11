import UI from './ui.js';

export default class GameUI extends UI {
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
    super();
    this.letters = GameUI.getEl('letters');
    this.guess = GameUI.getEl('guess');
    this.form = GameUI.getEl('guess-form');
    this.toast = GameUI.getEl('toast');
    this.guesses = GameUI.getEl('guesses');
    this.hint = GameUI.getEl('hint');
    this.shuffle = GameUI.getEl('shuffle');
    this.enter = GameUI.getEl('enter');
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
      if (e.key === 'Escape') {
        this.clearGuess();
        return;
      }

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
      const el = GameUI.getEl(id);
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
    const fragment = GameUI.getFrag();
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

  insertGuess(guess, classNames) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('guess-wrapper');
    const element = document.createElement('span');
    wrapper.appendChild(element);

    element.innerText = guess;
    element.classList.add('guess');
    if (classNames) {
      classNames.split(' ').forEach(className => {
        element.classList.add(className);
      });
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

  toggleFullscreen() {
    if (!document.fullscreenEnabled) {
      this.setToast('Fullscreen disabled', 'bad');
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }
}
