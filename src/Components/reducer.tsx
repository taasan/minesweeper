import {
  CellState,
  Cmd,
  GameRecord,
  GameState,
  Level,
  NextStateFunction,
  assertNever,
  calculateCoordinate,
  createGame,
  isCmdName,
} from '../Game';

import { NumeralSystem } from './Board/getContent';
import { ISettings } from './Settings/SettingsDialog';
import { ITheme } from '../Theme/theme';
import log from '../lib/log';
import { chunk } from '../lib';

type TimingEvent = number;

export type IState = Readonly<{
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
  showMenu: boolean;
  lives: 0 | 1 | 2;
}>;

export type CmdAction =
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
}

export type MenuAction =
  | {
      type: 'showMenu';
    }
  | {
      type: 'hideMenu';
    }
  | {
      type: 'toggleMenu';
    };

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
  | CmdAction
  | MenuAction;

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

const menuActionReducer = (state: IState, action: MenuAction): IState => {
  let { showMenu } = state;
  switch (action.type) {
    case 'hideMenu':
      showMenu = false;
      break;
    case 'showMenu':
      showMenu = false;
      break;
    case 'toggleMenu':
      showMenu = !showMenu;
      break;
  }

  return {
    ...state,
    showMenu,
  };
};

const commandActionReducer = (state: IState, action: CmdAction): IState => {
  if (
    action.type === 'TOGGLE_PAUSE' &&
    ![GameState.PAUSED, GameState.PLAYING].includes(state.board.state)
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
  if (state.board.state !== board.state) {
    log.debug('State changed', {
      old: GameState[state.board.state],
      new: GameState[newState.board.state],
    });
  }
  return newState;
};

type ReducerFunction<S, A> = (state: S, action: A) => S;

const reducer: ReducerFunction<IState, Action> = (state, action) => {
  if (action.type === 'POKE' || action.type === 'FLAG') {
    log.debug({
      ...action,
      ...calculateCoordinate(state.board.level.cols, action.coordinate),
    });
  } else {
    log.debug(action);
  }
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
        history: [],
      };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        timingEvents: [],
        elapsedTime: 0,
        loading: false,
        history: [],
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
        showMenu: false,
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
    case 'showMenu':
    case 'hideMenu':
    case 'toggleMenu':
      return menuActionReducer(state, action);
  }
  assertNever(action);
};

export type IHistoryState = IState & {
  history: Pick<GameRecord, 'cells' | 'cellStates' | 'state'>[];
};

const ensureHistory = (state: any): IHistoryState => {
  if (!stateIsHistoryState(state)) {
    state = { ...state, history: [] };
  }

  return state;
};

const stateIsHistoryState = (
  state: IHistoryState | IState
): state is IHistoryState => (state as IHistoryState).history !== undefined;

export const withHistory: ReducerFunction<IHistoryState, Action> = (
  state,
  action
): IHistoryState => {
  state = ensureHistory(state);
  const newState = ensureHistory(reducer(state, action));

  if (action.type === 'FLAG' || action.type === 'POKE') {
    const { cellStates, cells, state: gameState } = newState.board;
    return {
      ...newState,
      history: [
        ...state.history,
        {
          cellStates,
          cells,
          state: gameState,
        },
      ],
    };
  }
  return newState;
};

export const withLives: (
  lives: number,
  reducer: ReducerFunction<IState, Action>
) => ReducerFunction<IState, Action> = (
  lives: number,
  // eslint-disable-next-line no-shadow
  reducer: ReducerFunction<IState, Action>
) => (state: IState, action: Action) => {
  const newState = reducer(state, action);
  if (
    newState.board.state === GameState.GAME_OVER &&
    lives >= newState.board.cellStates[CellState.EXPLODED]
  ) {
    return {
      ...newState,
      board: newState.board.set('state', GameState.PLAYING),
    };
  }
  return newState;
};

export default withLives(2, reducer);
