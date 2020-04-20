import { ModalType, onGameOver } from './reducer';
import {
  GameRecord,
  GridType,
  Level,
  NextStateFunction,
  Topology,
  createGame,
} from '../Game';
import NumeralSystem from '../lib/NumeralSystem';
import { defaultTheme } from '../Theme';
import React from 'react';
import { ITheme } from '../Theme/theme';

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
  containerRef: React.RefObject<SVGSVGElement>;
  maxBoardDimensions: { maxWidth: string; maxHeight: string };
  modalStack: ModalType[];
  timingEvents: TimingEvent[];
  elapsedTime: number;
  showMenu: boolean;
  lives: 0 | 1 | 2;
  rotated: boolean;
}>;

/*
type IStateInit = Pick<IState, 'containerRef'> & {
  level: Level;
};

export function init({ level, containerRef }: IStateInit): IState {
  return {
    ...createGame(level, onGameOver),
    loading: false,
    containerRef,
    fitWindow: true,
    maxBoardDimensions: {
      maxHeight: 'revert',
      maxWidth: 'revert',
    },
    numeralSystem: NumeralSystem.HANGZHOU_NUMERAL,
    modalStack: [],
    theme: defaultTheme,
    timingEvents: [],
    elapsedTime: 0,
    showMenu: false,
    lives: 2,
  };
}
*/

export const initialState: IState = {
  game: {
    ...createGame(LEVELS.BEGINNER, onGameOver),
  },
  loading: false,
  maxBoardDimensions: {
    maxHeight: 'revert',
    maxWidth: 'revert',
  },
  modalStack: [],
  timingEvents: [],
  elapsedTime: 0,
  showMenu: false,
  lives: 2,
  containerRef: React.createRef(),
  rotated: false,
};

export default React.createContext<IState>(initialState);
