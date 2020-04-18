import {
  CellState,
  GameState,
  Mine,
  NumThreats,
  isNumThreats,
  randomInt,
} from '../../Game';
import { NumeralSystem } from '../../lib';

export const MINES = Object.freeze([
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
]);

export const getFlag = () => {
  const today = new Date();
  const isMay17 = today.getDate() === 17 && today.getMonth() === 4;
  return isMay17 ? '🇳🇴' : '☣️';
};

export function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState,
  numeralSystem: NumeralSystem
): string | NumThreats {
  if (state === CellState.EXPLODED) {
    return '💀';
  }

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
  if ((gameOver || state === CellState.OPEN) && threats === 0xff) {
    return MINES[randomInt(MINES.length)];
  }
  if (gameState === GameState.COMPLETED) {
    return getContent(
      CellState.OPEN,
      threats,
      GameState.PLAYING,
      numeralSystem
    );
  }
  switch (state) {
    case CellState.FLAGGED:
      return (demo || gameOver) && !isMined ? '💩' : getFlag();
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return isNumThreats(threats)
        ? renderThreats(numeralSystem, threats)
        : '\u00A0';
    default:
      return '\u00A0';
  }
}

export function renderThreats(numeralSystem: NumeralSystem, n: NumThreats) {
  return String.fromCodePoint(numeralSystem + n);
  // return formatNumber(numeralSystem, n); // String.fromCodePoint(numeralSystem + n);
}
