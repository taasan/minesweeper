import {
  CellState,
  Cmd,
  Coordinate,
  GameState,
  Level,
  calculateCoordinate,
  createGame,
  isCmdName,
} from '../Game';

import { assertNever, zero } from '../lib';
import { IState, TimingEvent } from './context';
import produce from 'immer';
import { getFitWindowCss } from '../lib';
import { chunk } from 'lodash';

export type PauseAction =
  | {
      type: 'UNPAUSE';
    }
  | {
      type: 'PAUSE';
    };

export type GameAction = {
  type: 'POKE' | 'FLAG';
  coordinate: Coordinate;
};

export type CmdAction = GameAction | PauseAction;

export function isCmdAction(s: Action): s is CmdAction {
  return isCmdName(s.type);
}

export function isPauseAction(action: Action): action is PauseAction {
  return action.type === 'PAUSE' || action.type === 'UNPAUSE';
}

export function isGameAction(action: Action): action is GameAction {
  return action.type === 'POKE' || action.type === 'FLAG';
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

export type LevelAction = {
  type: 'setLevel';
  level?: Level;
};

export type FitWindowAction = {
  type: 'fitWindow';
};

export type FullscreenAction =
  | {
      type: 'requestFullscreen';
    }
  | {
      type: 'exitFullscreen';
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
  | FitWindowAction
  | ModalAction
  | CmdAction
  | MenuAction
  | FullscreenAction;

export const onGameOver = () => {
  window.navigator.vibrate(
    [...new Array(6)].map((_, i) => ((i & 1) === 0 ? 300 : 100))
  );
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

  return produce(state, draft => {
    draft.showMenu = showMenu;
  });
};

const commandActionReducer = (state: IState, action: CmdAction): IState => {
  if (action.type === 'PAUSE' && state.game.board.state === GameState.PAUSED) {
    return state;
  }

  const isPauseCmd = isPauseAction(action);

  if (
    isPauseCmd &&
    ![GameState.PAUSED, GameState.PLAYING].includes(state.game.board.state)
  ) {
    return state;
  }

  const board = state.game.nextState(
    Cmd[action.type],
    [isGameAction(action) ? action.coordinate : -1, state.game.board],
    state.boardVersion
  );

  let addTimingEvent = isPauseCmd;
  switch (state.game.board.state) {
    case GameState.NOT_INITIALIZED:
    case GameState.INITIALIZED:
      addTimingEvent = action.type === 'POKE' || action.type === 'FLAG';
      break;
  }

  return produce(state, draft => {
    draft.boardVersion = board.version;
    if (addTimingEvent) {
      const tmp = [...state.timingEvents];
      const elapsedTime = () => {
        const len = tmp.length;
        if (len === 0) {
          return 0;
        }
        if (board.state === GameState.PLAYING && (len & 1) !== 1) {
          console.error('Unexpected array length');
        }
        const elapsed = calulateElapsedTime(tmp);
        if (board.state === GameState.PLAYING) {
          const lastStart = tmp[len - 1];
          return elapsed + Date.now() - lastStart;
        }
        return elapsed;
      };

      draft.timingEvents = tmp;
      draft.elapsedTime = elapsedTime;
      draft.timingEvents.push(Date.now());
    }
    draft.game.board = board;
    if (state.game.board.state !== board.state) {
      console.debug('State changed', {
        old: GameState[state.game.board.state],
        new: GameState[draft.game.board.state],
      });
    }
  });
};

type ReducerFunction<S, A> = (state: S, action: A) => S;

const reducer: ReducerFunction<IState, Action> = (state, action): IState => {
  if (action.type === 'POKE' || action.type === 'FLAG') {
    console.debug({
      ...action,
      ...calculateCoordinate(state.game.board.level.cols, action.coordinate),
    });
  } else {
    console.debug(action);
  }
  if (isCmdAction(action)) {
    return commandActionReducer(state, action);
  }
  const modalStackSize = state.modalStack.length;
  switch (action.type) {
    case 'setLevel': {
      const game = createGame(
        action.level != null ? action.level : state.game.board.level,
        onGameOver
      );
      return produce(state, draft => {
        draft.timingEvents = [];
        draft.elapsedTime = zero;
        draft.game = game;
        draft.modalStack = [];
      });
    }
    case 'showModal': {
      let newState = state;
      if (state.game.board.state === GameState.PLAYING) {
        newState = commandActionReducer(newState, {
          type: 'PAUSE',
        });
      }
      return produce(newState, draft => {
        draft.modalStack.push(action.modal);
        draft.showMenu = false;
      });
    }
    case 'closeModal':
      if (modalStackSize === 0) {
        console.warn('Modal stack is empty');
        return state;
      }
      return produce(state, draft => {
        draft.modalStack.pop();
      });
    case 'fitWindow':
      return produce(state, draft => {
        draft.maxBoardDimensions = getFitWindowCss(state.containerRef);
      });
    case 'showMenu':
    case 'hideMenu':
    case 'toggleMenu':
      return menuActionReducer(state, action);
    case 'requestFullscreen':
      if (!document.fullscreen) {
        document.documentElement.requestFullscreen().catch();
      }
      return state;
    case 'exitFullscreen':
      if (document.fullscreen) {
        document.exitFullscreen().catch();
      }
      return state;
  }
  assertNever(action);
};

export const withLives: (
  lives: number,
  reducer: ReducerFunction<IState, Action>
) => ReducerFunction<IState, Action> = (
  lives: number,
  // eslint-disable-next-line no-shadow
  reducer: ReducerFunction<IState, Action>
) => (state: IState, action: Action): IState => {
  const newState = reducer(state, action);
  if (
    newState.game.board.state === GameState.GAME_OVER &&
    lives >= newState.game.board.cellStates[CellState.EXPLODED]
  ) {
    return produce(newState, draft => {
      draft.game.board.state = GameState.PLAYING;
    });
  }
  return newState;
};

export default withLives(2, reducer);
