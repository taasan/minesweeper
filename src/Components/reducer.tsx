import {
  Cmd,
  GameRecord,
  GameState,
  Level,
  NextStateFunction,
  assertNever,
  createGame,
  isCmdName,
} from '../Game';

import { NumeralSystem } from './Board/getContent';
import { ISettings } from './Settings/SettingsDialog';
import { ITheme } from '../Theme';
import log from '../lib/log';
import { chunk } from '../lib';

type TimingEvent = number;

export type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.RefObject<SVGSVGElement>;
  fitWindow: boolean;
  maxBoardDimensions: { maxWidth: string; maxHeight: string };
  modalStack: ModalType[];
  numeralSystem: NumeralSystem;
  theme: ITheme;
  timingEvents: TimingEvent[];
  elapsedTime: number;
};

export type CmdAction =
  | {
      type: 'NONE';
    }
  | {
      type: 'TOGGLE_PAUSE';
    }
  | {
      type: 'POKE' | 'FLAG';
      coordinate: number;
    };

export function isCmdAction(s: Action): s is CmdAction {
  return isCmdName(s.type);
}

export enum ModalType {
  SELECT_LEVEL,
  SETTINGS,
  GOL,
}

export type SettingsAction = {
  type: 'applySettings';
  settings: ISettings;
};

export type LevelAction = {
  type: 'setLevel';
  level: Level;
};

export type BoardAction = {
  type: 'setBoard';
  game: {
    board: GameRecord;
    nextState: NextStateFunction;
  };
};

export type FitWindowAction = {
  type: 'fitWindow';
};

export type ModalAction =
  | {
      type: 'showModal';
      modal: ModalType;
    }
  | {
      type: 'closeModal';
    };

export type Action =
  | LevelAction
  | BoardAction
  | SettingsAction
  | FitWindowAction
  | ModalAction
  | CmdAction;

export const onGameOver = () => {
  window.navigator.vibrate(
    [...new Array(6)].map((_, i) => ((i & 1) === 0 ? 300 : 100))
  );
};

const calculateCssMaxDimensions = (board: React.RefObject<SVGSVGElement>) => {
  if (board.current == null) {
    return {
      maxHeight: 'revert',
      maxWidth: 'revert',
    };
  }

  const { top } = board.current.getBoundingClientRect();
  return {
    maxWidth: '100vw',
    // Must add 3-5 px to prevent scrollbars
    maxHeight: `calc(100vh - ${top + 5}px)`,
  };
};

const calulateElapsedTime = (timingEvents: TimingEvent[]) => {
  const t = [...timingEvents];
  if ((t.length & 1) === 1) t.pop(); // t.push(Date.now());

  return chunk(
    t.map((v, _, arr) => v - arr[0]),
    2
  )
    .map(([a, b]) => (b != null ? b - a : b))
    .reduce((result, n) => result + n, 0);
};

const commandActionReducer = (state: IState, action: CmdAction): IState => {
  if (
    action.type === 'NONE' ||
    (action.type === 'TOGGLE_PAUSE' &&
      ![GameState.PAUSED, GameState.PLAYING].includes(state.board.state))
  ) {
    return state;
  }
  const board = state.nextState(Cmd[action.type], [
    action.type === 'TOGGLE_PAUSE' ? -1 : action.coordinate,
    state.board,
  ]);

  let addTimingEvent = action.type === 'TOGGLE_PAUSE';
  switch (state.board.state) {
    case GameState.NOT_INITIALIZED:
    case GameState.INITIALIZED:
      addTimingEvent = action.type === 'POKE' || action.type === 'FLAG';
      break;
  }

  let newState = { ...state };
  if (addTimingEvent) {
    const t = [...state.timingEvents];
    const elapsedTime = calulateElapsedTime(t);

    newState.timingEvents = t;
    newState.elapsedTime = elapsedTime;
    t.push(Date.now());
  }
  newState.board = board;
  return newState;
};

const reducer = (state: IState, action: Action): IState => {
  log.debug(action);
  if (isCmdAction(action)) {
    return commandActionReducer(state, action);
  }
  const modalStackSize = state.modalStack.length;
  switch (action.type) {
    case 'setLevel':
      const { board, nextState } = createGame(action.level, onGameOver);
      return {
        ...state,
        timingEvents: [],
        elapsedTime: 0,
        board,
        nextState,
        modalStack: [],
      };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        timingEvents: [],
        elapsedTime: 0,
        loading: false,
      };
    case 'applySettings':
      return {
        ...state,
        ...action.settings,
        modalStack: [],
      };
    case 'showModal': {
      let newState = state;
      if (state.board.state === GameState.PLAYING) {
        newState = commandActionReducer(newState, {
          type: 'TOGGLE_PAUSE',
        });
      }
      return {
        ...newState,
        modalStack: [...state.modalStack].concat([action.modal]),
      };
    }
    case 'closeModal':
      if (modalStackSize === 0) {
        log.warn('Modal stack is empty');
        return state;
      }
      const modalStack = [...state.modalStack];
      modalStack.pop();
      return {
        ...state,
        modalStack,
      };
    case 'fitWindow':
      return {
        ...state,
        maxBoardDimensions: calculateCssMaxDimensions(state.containerRef),
      };
  }
  assertNever(action);
};

export default reducer;
/*
export default (state: IState, action: Action): IState => {
  const s = reducer(state, action);
  log.debug({ newState: s });
  return s;
};
*/
