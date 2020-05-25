from math import floor
import random
import solver
from time import time

correct_guesses = []
solution = []
word_map = {}

PANGRAM_LENGTH = 7

def main():
  global correct_guesses
  global solution
  global word_map

  print('Rules:')
  print('  1. All words must include the base letter. This is given as the first letter.')
  print('  2. Words must be at least four letters in length.')
  print('  3. All solutions include a pangram containing all of the letters.')

  solver.init()
  random.seed(time())

  # Load word list
  words = get_words()
  make_word_map(words)

  # Select random puzzle
  letters = get_puzzle()
  solution = solver.getMatches(letters)

  # Validate guesses
  play(letters)

  if 'y' == raw_input('Would you like to play again? (y/n): ').lower():
    correct_guesses = []
    main()

def get_words():
  file = open('ww7.txt')
  lines = file.read()
  words = lines.split('\n')
  file.close()
  return words

def make_word_map(words):
  global word_map
  for word in words:
    if len(word) == 0:
      continue
    key = get_word_key(word)
    if key not in word_map:
      word_map[key] = []
    if word not in word_map[key]:
      word_map[key].append(word)

def get_word_key(word):
  letters = []
  for letter in word:
    if letter not in letters:
      letters.append(letter)
  letters.sort()
  return ''.join(letters)

def get_puzzle():
  global PANGRAM_LENGTH
  global word_map
  # Restrict candidates to 7 letters
  candidates = [candidate for candidate in word_map.keys() if len(candidate) == PANGRAM_LENGTH]

  candidate = None
  while is_too_hard(candidate):
    candidate = random.sample(candidates, 1)[0]

  return candidate

def is_too_hard(candidate):
  global word_map

  if candidate is None:
    return True

  solution = solver.getMatches(candidate)

  # Must have 5 or more words.
  if len(solution) < 5:
    #print('Candidate (%s) has too few words: %r' % (candidate, solution))
    return True

  if len(solution) > 50:
    #print('Cnadidate (%s) has too many words: %d' % (candidate, len(solution)))
    return True

  # Must have 3 or more words of 3-4 letters
  if len([i for i in solution if len(i) < 5]) < 3:
    #print('Candidate (%s) has too few easy words: %r' % (candidate, solution))
    return True

  return False

def play(letters):
  global correct_guesses
  global solution

  base = letters[0]
  letters = letters.upper()

  m = len(solution)

  RED = '\033[0;31m'
  GREEN = '\033[0;32m'
  PURPLE = '\033[0;35m'
  NC = '\033[0m'

  guess = ''
  while not is_solved():
    n = len(correct_guesses)
    print('')
    if len(correct_guesses) > 0:
      print(correct_guesses)
    print('Your letters are: %s' % ' '.join(list(letters)))
    guess = raw_input('[%s] (%d/%d) Enter your guess (or "q" to quit): ' % (letters, n, m)).lower()

    if guess == 'q':
      break

    if guess == 'h':
      hint = ''
      while hint in correct_guesses:
        hint = random.sample(solution, 1)
      print('[%s] %sHint: %s%s' % (letters, PURPLE, hint[:3], NC))
      continue

    if base not in guess:
      print('[%s] %sGuess does not contain the base letter (%s) %s' % (letters, RED, base, NC))
    elif guess in correct_guesses:
      print('[%s] %sAlready guessed%s' % (letters, RED, NC))
    elif guess in solution:
      if len(''.join(set(guess))) == 7:
        print('[%s] %sPANGRAM!!%s' % (letters, GREEN, NC))
      else:
        print('[%s] %sCorrect!%s' % (letters, GREEN, NC))
      correct_guesses.append(guess)
      correct_guesses.sort()
    else:
      print('[%s] %sUnrecognized guess%s' % (letters, RED, NC))

  if is_solved():
    print('%sYOU WIN!%s' % (GREEN, NC))
  else:
    print('%sGame over%s' % (RED, NC))

def is_solved():
  global correct_guesses
  global solution

  return solution == correct_guesses


main()