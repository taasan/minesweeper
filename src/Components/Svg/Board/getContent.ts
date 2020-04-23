import {
  CellState,
  GameState,
  Mine,
  NumThreats,
  isNumThreats,
  randomInt,
} from '../../../Game';
import { NumeralSystem } from '../../../lib';
import { Content, SvgSymbolKey } from '../../../graphics';
import getSymbol from '../../../graphics/noto-emoji';

const MINES = Object.freeze([
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

const FLAG = '☣️';
const UNCERTAIN_FLAG = '❓';
const UNFLAGGED_MINE = '🥺';
const MISPLACED_FLAG = '💩';
const NATIONAL_FLAG = '🇳🇴';

export const DISARMED_MINE = '🥰';
export const EXPLODED_MINE = '💀';

export const getFlag = () => {
  const today = new Date();
  const isMay17 = today.getDate() === 17 && today.getMonth() === 4;
  return isMay17 ? NATIONAL_FLAG : FLAG;
};

export function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState,
  numeralSystem: NumeralSystem
): Content {
  if (state === CellState.EXPLODED) {
    return getSymbol(EXPLODED_MINE);
  }

  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const demo = gameState === GameState.DEMO;
  const done = gameOver || gameWon || demo;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && isFlagged && (gameWon || gameOver);
  if (gameWon && isMined && state !== CellState.FLAGGED) {
    return getSymbol(UNFLAGGED_MINE);
  }
  if (isDisarmed) {
    return getSymbol(DISARMED_MINE);
  }
  if ((gameOver || state === CellState.OPEN) && threats === 0xff) {
    return getSymbol(MINES[randomInt(MINES.length)] as SvgSymbolKey);
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
      return getSymbol(
        (demo || gameOver) && !isMined ? MISPLACED_FLAG : getFlag()
      );
    case CellState.UNCERTAIN:
      return getSymbol(UNCERTAIN_FLAG);
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
