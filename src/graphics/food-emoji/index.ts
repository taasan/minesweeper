import {
  DISARMED_MINE,
  EXPLODED_MINE,
  FLAG,
  MISPLACED_FLAG,
  NATIONAL_FLAG,
  SvgSymbolKey,
  UNCERTAIN_FLAG,
  UNFLAGGED_MINE,
} from '..';

const symbols = Object.freeze({
  '🤒': '🍟', // Mine
  '😷': '🍧', // Mine
  '🤮': '🍨', // Mine
  '🤢': '🍩', // Mine
  '🤡': '🍪', // Mine
  '🧟': '🍫', // Mine
  '🤥': '🍬', // Mine
  '🤕': '🍭', // Mine
  '🤧': '🍮', // Mine
  '👻': '🍯', // Mine
  '🥵': '🍰', // Mine
  '🥶': '🥧', // Mine
  '👹': '🥯', // Mine
  '👺': '🥐', // Mine
  '🦠': '🥨', // Mine
  [NATIONAL_FLAG]: '💎', // National flag
  [FLAG]: '🧸', // Flag
  [UNCERTAIN_FLAG]: '🦧', // Flag uncertain
  [UNFLAGGED_MINE]: '🦷', // Not flagged at game completed
  [MISPLACED_FLAG]: '🧛‍♀️', // Flagged incorrectly (at game over)
  [DISARMED_MINE]: '🥦', // Flagged and mined at game completed / game over
  [EXPLODED_MINE]: '💥', // Exploded mine
});

export default (key: SvgSymbolKey) => symbols[key] ?? key;
