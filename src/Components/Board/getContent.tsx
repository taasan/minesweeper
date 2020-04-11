import {
  CellState,
  GameState,
  NumThreats,
  Mine,
  isNumThreats,
  randomInt,
} from '../../Game';

export enum NumeralSystem {
  ascii = 0x30,
  arab = 0x660,
  beng = 0x9e6,
  deva = 0x966,
  guru = 0xa66,
  nkoo = 0x7c0,
  lepc = 0x1c40,
  roman = 0x215f,
  taml = 0x0be6,
}

export function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState,
  numeralSystem: NumeralSystem
): string | NumThreats {
  const mines = [
    '🤒',
    '😷',
    '🤮',
    '🤢',
    '🤡',
    '🧟',
    '🤥',
    '🤕',
    '🤧',
    '👻',
    '🥵',
    '🥶',
    '👹',
    '👺',
    '🦠',
  ];
  const disarmedMine = '🥰';
  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const demo = gameState === GameState.DEMO;
  const done = gameOver || gameWon || demo;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && isFlagged && (gameWon || gameOver);
  if (gameWon && isMined && state !== CellState.FLAGGED) {
    return '🥺';
  }
  if (isDisarmed) {
    return disarmedMine;
  }
  if (
    ((gameOver && state !== CellState.EXPLODED) || state === CellState.OPEN) &&
    threats === 0xff
  ) {
    return mines[randomInt(mines.length)];
  }
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return getContent(
      CellState.OPEN,
      threats,
      GameState.PLAYING,
      numeralSystem
    );
  }
  switch (state) {
    case CellState.FLAGGED:
      return (demo || gameOver) && !isMined ? '💩' : '☣️';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return isNumThreats(threats)
        ? renderThreats(numeralSystem, threats)
        : '\u00A0';
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}

export function renderThreats(numeralSystem: NumeralSystem, n: NumThreats) {
  return String.fromCodePoint(numeralSystem + n);
}
