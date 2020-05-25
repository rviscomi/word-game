from itertools import permutations

wordMap = {}

def main():
  init()
  letters = getLetters()
  matches = getMatches(letters)
  matches.sort()
  print(matches)

def init():
  words = getWords()
  makeWordMap(words)

def getWords():
  file = open('ww7.txt')
  lines = file.read()
  words = lines.split('\n')
  file.close()
  return words

def makeWordMap(words):
  global wordMap
  for word in words:
    if len(word) == 0:
      continue
    key = getWordKey(word)
    if key not in wordMap:
      wordMap[key] = []
    wordMap[key].append(word)

def getWordKey(word):
  letters = []
  for letter in word:
    if letter not in letters:
      letters.append(letter)
  letters.sort()
  return ''.join(letters)

def getLetters():
  return raw_input('What are the letters? ').lower()

def getMatches(letters):
  matches = []
  candidates = getCandidates(letters)
  for candidate in candidates:
    words = findWords(candidate)
    for word in words:
      if word not in matches:
        matches.append(word)
  return matches

def getCandidates(letters):
  # Rule: 0th letter is required in all permutations.
  stem = letters[0]
  letters = letters[1:]
  candidates = []
  for length in range(1, 7):
    for permutation in permutations(letters, r=length):
      candidates.append(stem + ''.join(permutation))
  return candidates

def findWords(candidate):
  global wordMap
  key = getWordKey(candidate)
  return wordMap.get(key, [])


if __name__ == '__main__':
  main()