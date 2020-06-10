export default class Storage {
  constructor(letters) {
    this.letters = letters;
    this.state = this.getState();
  }

  getState() {
    const state = Storage.deserialize(localStorage.getItem(this.letters));
    if (state) {
      return state;
    }

    return {
      'guesses': [],
      'stats': {}
    }
  }

  setState() {
    localStorage.setItem(this.letters, Storage.serialize(this.state));
  }

  getGuesses() {
    return this.state.guesses;
  }

  addGuess(guess, classNames) {
    this.state.guesses.push({guess, classNames});
    this.setState();
  }

  static serialize(object) {
    return JSON.stringify(object);
  }

  static deserialize(string) {
    return JSON.parse(string);
  }
}