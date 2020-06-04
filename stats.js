import UI from './ui.js';

export default class Stats {
  constructor() {
    this.startTime = Date.now();
    this.ui = new StatsUI();
    this.longest = 0;
    this.mostDistinctLetters = 0;
    this.hints = 0;
  }

  set foundWord(foundWord) {
    if (foundWord.length > this.longest) {
      this.longest = foundWord.length;
      this.ui.setLongestWordCount(this.longest);
    }

    const distinctLetters = new Set(foundWord);
    if (distinctLetters.size > this.mostDistinctLetters) {
      this.mostDistinctLetters = distinctLetters.size;
      this.ui.setMostLetters(this.mostDistinctLetters);
    }
  }

  set foundWords(foundWords) {
    this._foundWords = foundWords;
    this.ui.setFoundWordCount(foundWords.size);

    if (this._totalWordCount) {
      this.ui.setProgress(foundWords.size, this._totalWordCount);
    }

    if (!foundWords.size) {
      return;
    }

    const totalLength = Array.from(foundWords).reduce((sum, word) => sum += word.length, 0);
    const avgLength = totalLength / foundWords.size;
    this.ui.setAverageWordLength(avgLength);

    const wordsPerMinute = foundWords.size / ((Date.now() - this.startTime) / 60000);
    this.ui.setWordsPerMinute(wordsPerMinute);
  }

  set totalWordCount(totalWordCount) {
    this._totalWordCount = totalWordCount;
    this.ui.setTotalWordCount(totalWordCount);

    this.ui.setProgress(this._foundWords?.size || 0, totalWordCount);
  }

  toggleStats(force) {
    this.ui.toggleStats(force);
  }

  countHint(numHints) {
    numHints = numHints || 1;
    this.hints += numHints;
    this.ui.setHints(this.hints);
  }
}

class StatsUI {
  constructor() {
    this.toggleButton = UI.getEl('toggle-stats');
    this.expandedStats = UI.getEl('expanded-stats');
    this.progressBar = UI.getEl('progress-bar');
    this.foundWordCount = UI.getEl('found');
    this.totalWordCount = UI.getEl('total');
    this.longestWordCount = UI.getEl('longest');
    this.mostLetters = UI.getEl('most-letters');
    this.avgLength = UI.getEl('avg-length');
    this.wordsPerMinute = UI.getEl('wpm');
    this.hints = UI.getEl('hints');

    this.init();
  }

  init() {
    this.toggleButton.addEventListener('click', e => {
      this.toggleStats();
    });
  }

  toggleStats(force) {
    this.expandedStats.classList.toggle('hidden', force);
  }

  setFoundWordCount(foundWordCount) {
    this.foundWordCount.innerText = foundWordCount;
  }

  setTotalWordCount(totalWordCount) {
    this.totalWordCount.innerText = totalWordCount;
  }

  setProgress(foundWordCount, totalWordCount) {
    this.progressBar.style.width = `${foundWordCount * 100 / totalWordCount}%`;
  }

  setLongestWordCount(longestWordCount) {
    this.longestWordCount.innerText = longestWordCount;
  }

  setMostLetters(mostLetters) {
    this.mostLetters.innerText = mostLetters;
  }

  setAverageWordLength(avgLength) {
    this.avgLength.innerText = avgLength.toFixed(1);
  }

  setWordsPerMinute(wordsPerMinute) {
    this.wordsPerMinute.innerText = wordsPerMinute.toFixed(1);
  }

  setHints(hints) {
    this.hints.innerText = hints;
  }
}