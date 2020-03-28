import {
  CellState,
  GameState,
  NumThreats,
  Mine,
  isNumThreats,
  randomInt,
} from '../../Game';

export function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
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
    '👺',
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
  if ((gameOver || demo) && state !== CellState.EXPLODED && threats === 0xff) {
    return mines[randomInt(mines.length)];
  }
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return getContent(CellState.OPEN, threats, GameState.PLAYING);
  }
  switch (state) {
    case CellState.FLAGGED:
      return (demo || gameOver) && !isMined ? '💩' : '🚩';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return isNumThreats(threats) ? threats : '\u00A0';
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}
