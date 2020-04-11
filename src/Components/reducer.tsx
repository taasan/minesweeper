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

import { NumeralSystem } from './Board/getContent';
import { Dispatch } from 'react';
import { ISettings } from './Settings/SettingsDialog';

export type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.RefObject<SVGSVGElement>;
  fitWindow: boolean;
  maxBoardDimensions: { maxWidth: string; maxHeight: string };
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
  SETTINGS,
}

export type Action =
  | { type: 'setLevel'; level: Level; dispatch: Dispatch<Action> }
  | {
      type: 'setBoard';
      game: { board: GameRecord; nextState: NextStateFunction };
    }
  | {
      type: 'fitWindow';
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
      };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        loading: false,
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
    case 'fitWindow':
      return {
        ...state,
        maxBoardDimensions: calculateCssMaxDimensions(state.containerRef),
      };
  }
  assertNever(action);
};

export default reducer;
