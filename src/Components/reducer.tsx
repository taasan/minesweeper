import {
  GameState,
  Cmd,
  createGame,
  assertNever,
  GameRecord,
  NextStateFunction,
  CmdName,
  isCmdName,
  Level,
} from '../Game';
import { getMaxScalingFactor } from './SvgMinesweeper';
import { NumeralSystem } from './Board/getContent';
import { Dispatch } from 'react';
import { ISettings } from './Settings/SettingsDialog';

export type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  scalingFactor: number;
  modalStack: ModalType[];
  numeralSystem: NumeralSystem;
};

export type CmdAction = {
  type: CmdName;
  coordinate: number;
  dispatch: Dispatch<Action>;
};

export function isCmdAction(s: Action): s is CmdAction {
  return isCmdName(s.type);
}

export enum ModalType {
  SELECT_LEVEL,
  GAME_OVER,
  SETTINGS,
}

export type Action =
  | { type: 'setLevel'; level: Level; dispatch: Dispatch<Action> }
  | {
      type: 'setBoard';
      game: { board: GameRecord; nextState: NextStateFunction };
    }
  | {
      type: 'setScalingFactor';
    }
  | {
      type: 'setNumeralSystem';
      numeralSystem: NumeralSystem;
    }
  | {
      type: 'applySettings';
      settings: ISettings;
    }
  | {
      type: 'showModal';
      modal: ModalType;
    }
  | {
      type: 'closeModal';
    }
  | CmdAction;
/*
  function setBoardAction(
    f: () => object,
    state: IState,
    dispatch: Dispatch<Action>
  ) {
    new Promise<IState>(resolve => resolve({ ...state, ...f() }))
      .then(game => dispatch({ type: 'setBoard', game }))
      .then(() => dispatch({ type: 'setScalingFactor' }))
      .catch(err => ({
        ...state,
        board: state.board.set('error', err).set('state', GameState.ERROR),
      }));
  }
  */

const reducer = (state: IState, action: Action): IState => {
  console.log(action);
  if (isCmdAction(action)) {
    if (
      action.type === 'TOGGLE_PAUSE' &&
      ![GameState.PAUSED, GameState.PLAYING].includes(state.board.state)
    ) {
      return state;
    }
    const board = state.nextState(Cmd[action.type], [
      action.coordinate,
      state.board,
    ]);
    return {
      ...state,
      board,
      modalStack:
        board.state === GameState.GAME_OVER ||
        board.state === GameState.COMPLETED
          ? [ModalType.GAME_OVER]
          : state.modalStack,
    };
  }
  const modalStackSize = state.modalStack.length;
  switch (action.type) {
    case 'setLevel':
      const { board, nextState } = createGame(action.level);
      return {
        ...state,
        board,
        nextState,
        modalStack: [],
        scalingFactor: getMaxScalingFactor(state.containerRef),
      };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        loading: false,
      };
    case 'setScalingFactor':
      return {
        ...state,
        scalingFactor: getMaxScalingFactor(state.containerRef),
      };
    case 'setNumeralSystem':
      return {
        ...state,
        numeralSystem: action.numeralSystem,
      };
    case 'applySettings':
      return {
        ...state,
        ...action.settings,
        modalStack: [],
      };
    case 'showModal':
      return {
        ...state,
        modalStack: [...state.modalStack].concat([action.modal]),
      };
    case 'closeModal':
      if (modalStackSize === 0) {
        console.warn('Modal stack is empty');
        return state;
      }
      const modalStack = [...state.modalStack];
      modalStack.pop();
      return {
        ...state,
        modalStack,
      };
  }
  assertNever(action);
};

export default reducer;
