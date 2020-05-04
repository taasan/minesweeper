import {
  CellRecord,
  CellState,
  GameState,
  NumThreats,
  getMine,
  getState,
  getThreats,
  isNumThreats,
  setState,
} from '../../../Game';
import { NumeralSystem } from '../../../lib';
import {
  Content,
  DISARMED_MINE,
  EXPLODED_MINE,
  FLAG,
  MINES,
  MISPLACED_FLAG,
  SvgSymbolKey,
  UNCERTAIN_FLAG,
  UNFLAGGED_MINE,
  getFlag,
} from '../../../graphics';
import render from '../../../graphics/noto-emoji';

export function getContent(
  cell: CellRecord,
  gameState: GameState,
  numeralSystem: NumeralSystem,
  getSymbol: typeof render = render
): Content {
  if (gameState === GameState.PAUSED) {
    return '\u00A0';
  }
  const state = getState(cell);
  const mine = getMine(cell);
  const threatCount = getThreats(cell);
  if (state === CellState.EXPLODED) {
    return getSymbol(EXPLODED_MINE);
  }

  const isMined = mine !== undefined;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const demo = gameState === GameState.DEMO;
  const done = gameOver || gameWon || demo;
  const isFlagged = state === CellState.FLAGGED;
  if (!done && isFlagged) {
    return getSymbol(FLAG);
  }
  const isDisarmed = done && isMined && isFlagged && (gameWon || gameOver);
  if (gameWon && isMined && state !== CellState.FLAGGED) {
    return getSymbol(UNFLAGGED_MINE);
  }
  if (isDisarmed) {
    return getSymbol(DISARMED_MINE);
  }
  if ((gameOver || state === CellState.OPEN) && mine !== undefined) {
    return getSymbol(MINES[mine] as SvgSymbolKey);
  }
  if (gameState === GameState.COMPLETED) {
    return getContent(
      setState(cell, CellState.OPEN),
      GameState.PLAYING,
      numeralSystem,
      getSymbol
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
      return isNumThreats(threatCount)
        ? renderThreats(numeralSystem, threatCount)
        : '\u00A0';
    default:
      return '\u00A0';
  }
}

export function renderThreats(numeralSystem: NumeralSystem, n: NumThreats) {
  return String.fromCodePoint(numeralSystem + n);
  // return formatNumber(numeralSystem, n); // String.fromCodePoint(numeralSystem + n);
}
