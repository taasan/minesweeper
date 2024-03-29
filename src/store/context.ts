import { Action, ModalType, onGameOver } from './reducer';
import {
  GameRecord,
  GridType,
  Level,
  NextStateFunction,
  Topology,
  createGame,
  validateLevel,
} from '../Game';
import NumeralSystem from '../lib/NumeralSystem';
import { defaultTheme } from '../Theme';
import React from 'react';
import { ITheme } from '../Theme/theme';
import { zero } from '../lib';
import { loadValue } from './contexts/settings';
import _ from 'lodash';

type ILevels = {
  [keyof: string]: Level;
};
const type = GridType.HEX;
const topology = Topology.LIMITED;

export const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10, type, topology },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40, type, topology },
  EXPERT: { mines: 99, rows: 16, cols: 30, type, topology },
};

export type ISettings = {
  numeralSystem: NumeralSystem;
  fitWindow: boolean;
  theme: ITheme;
};

export const initialSettings: ISettings = {
  numeralSystem: NumeralSystem.HANGZHOU_NUMERAL,
  theme: defaultTheme,
  fitWindow: true,
};

export type TimingEvent = number;

export type IState = Readonly<{
  game: {
    board: GameRecord;
    nextState: NextStateFunction;
  };
  loading: boolean;
  maxBoardDimensions: { maxWidth: string; maxHeight: string };
  modalStack: ModalType[];
  timingEvents: TimingEvent[];
  elapsedTime(): number;
  showMenu: boolean;
  lives: 0 | 1 | 2;
  rotated: boolean;
  boardVersion: number;
}>;

let level: Level | undefined;
try {
  level = loadValue('object', 'level');
  if (level != null) {
    validateLevel(level);
  }
} catch (err) {}

if (level == null) {
  level = LEVELS.BEGINNER;
}

export const initialState: IState = {
  game: {
    ...createGame(level, onGameOver),
  },
  loading: false,
  maxBoardDimensions: {
    maxHeight: 'revert',
    maxWidth: 'revert',
  },
  modalStack: [],
  timingEvents: [],
  elapsedTime: zero,
  showMenu: false,
  lives: 2,
  rotated: false,
  boardVersion: 0,
};

export default React.createContext<{
  state: IState;
  dispatch: React.Dispatch<Action>;
  containerRef: React.RefObject<SVGSVGElement>;
}>({
  state: initialState,
  dispatch: _.noop,
  containerRef: React.createRef(),
});
