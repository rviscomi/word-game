from math import floor
import random
import solver
from time import time

correct_guesses = []
solution = []
word_map = {}

PANGRAM_LENGTH = 7

def main(letters=None):
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
  if not letters:
    letters = get_puzzle()
  solution = solver.getMatches(letters)

  # Validate guesses
  play(letters)

  correct_guesses = []
  response = raw_input('Would you like to play again? (y/N): ').lower()
  if 'y' == response:
    main()
  elif len(response) == 7:
    main(response)

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
  YELLOW = '\033[0;33m'
  PURPLE = '\033[0;35m'
  NC = '\033[0m'

  def format_letters():
    return ' %s %s\n%s %s%s%s %s\n %s %s' % (
      letters[1], letters[2],
      letters[3], YELLOW, letters[0], NC, letters[4],
      letters[5], letters[6])

  formatted_letters = format_letters()

  guess = ''
  while not is_solved():
    n = len(correct_guesses)
    print('')
    if len(correct_guesses) > 0:
      print(', '.join(correct_guesses))
    print('')
    print(formatted_letters)
    print('')
    guess = raw_input('[%d/%d) Enter your guess (or "q" to quit): ' % (n, m)).lower()

    if guess == 'q':
      break

    if guess == 'h':
      hint = ''
      while hint == '' or hint in correct_guesses:
        hint = random.sample(solution, 1)[0]
      hint_length = 3
      if random.random() * 1000 < 1:
        hint_length = 10
      elif random.random() * 100 < 1:
        hint_length = 5
      print('%sHint: %s%s%s' % (PURPLE, hint[:hint_length],
        ''.join(['_' for i in hint[hint_length:]]), NC))
      continue

    if guess == 's':
      shuffled = list(letters[1:])
      random.shuffle(shuffled)
      letters = letters[:1] + ''.join(shuffled)
      formatted_letters = format_letters()
      continue

    if guess == 'konami code':
      correct_guesses = solution
      print(', '.join(solution))
      continue

    if len(guess) < 4:
      print('%sGuesses must be at least 4 letters%s' % (RED, NC))
    elif base not in guess:
      print('%sGuess does not contain the base letter (%s) %s' % (RED, base, NC))
    elif guess in correct_guesses:
      print('%sAlready guessed%s' % (RED, NC))
    elif guess in solution:
      if len(''.join(set(guess))) == 7:
        print('%sPANGRAM!!%s' % (GREEN, NC))
      else:
        print('%sCorrect!%s' % (GREEN, NC))
      correct_guesses.append(guess)
      correct_guesses.sort()
    else:
      print('%sUnrecognized guess%s' % (RED, NC))

  if is_solved():
    print('%s*~YOU WIN!~*%s' % (GREEN, NC))
  else:
    print('%sGame over%s' % (RED, NC))

def is_solved():
  global correct_guesses
  global solution

  return len(solution) == len(correct_guesses)


main()