import json
import solver

PANGRAM_LENGTH = 7
word_map = {}

def main():
  global word_map

  solver.init()
  get_word_map()
  puzzles = get_puzzles()

  for difficulty in ['easy', 'medium', 'hard']:
    f = open('%s.json' % difficulty, 'w')
    f.write(serialize(puzzles.get(difficulty)))
    f.close()
    print('%s: %d' % (difficulty, len(puzzles.get(difficulty))))

def get_word_map():
  global word_map

  f = open('word_map.json', 'r')
  word_map = json.loads(f.read())
  f.close()

def serialize(obj):
  return json.dumps(obj, indent=2)

def get_puzzles():
  global PANGRAM_LENGTH
  global word_map

  puzzles = {
    'easy': {},
    'medium': {},
    'hard': {}
  }

  for puzzle in word_map.keys():
    if len(puzzle) != PANGRAM_LENGTH:
      continue

    solution = solver.getMatches(puzzle)
    difficulty = get_difficulty(solution)
    puzzles[difficulty][puzzle] = solution

  return puzzles

def get_difficulty(solution):
  # More than 200 words.
  if len(solution) > 200:
    return 'hard'

  # Fewer than 20 words. Most are 6+ letters.
  if len(solution) < 20 and len([i for i in solution if len(i) > 5]) > 10:
    return 'hard'

  # More than 100 words.
  if len(solution) > 50:
    return 'medium'

  return 'easy'


main()