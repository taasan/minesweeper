import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  GameState,
  Level,
  GameRecord,
  Cmd,
  createGame,
  NextStateFunction,
  CmdName,
  isCmdName,
  GridType,
  assertNever,
  // legend,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer, Dispatch } from 'react';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '.';
//
/*
enum TimingEventType {
  START,
  STOP,
}

type TimingEvent = {
  type: TimingEventType;
  timestamp: number;
};
*/

type ILevels = {
  [keyof: string]: Level;
};
const type = GridType.HEX;

export const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10, type },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40, type },
  EXPERT: { mines: 99, rows: 16, cols: 30, type },
};

type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  scalingFactor: number;
  rotated: boolean;
};

type CmdAction = {
  type: CmdName;
  coordinate: number;
  dispatch: Dispatch<Action>;
};

function isCmdAction(s: Action): s is CmdAction {
  return isCmdName(s.type);
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
      type: 'toggleRotated';
      dispatch: Dispatch<Action>;
    }
  | CmdAction;

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

function getMaxScalingFactor({ containerRef }: IState): number {
  if (containerRef != null && containerRef.current != null) {
    const { current } = containerRef;
    const boardElement = current.querySelector('.SvgBoard');

    if (boardElement == null) {
      return 1;
    }
    // const { clientWidth, clientHeight } = current;
    const { clientWidth, clientHeight } = document.documentElement;
    const width = boardElement.clientWidth;
    const height = boardElement.clientHeight;
    if (height === 0 || width === 0) {
      return 1;
    }
    const a = Math.min(clientHeight, current.clientHeight) / height;
    const b = Math.min(clientWidth, current.clientWidth) / width;
    // console.log({ clientHeight, clientWidth, height, width, a, b });
    return Math.min(a, b);
  }

  return 1;
}

function reducer(state: IState, action: Action): IState {
  if (isCmdAction(action)) {
    setBoardAction(
      () => ({
        board: state.nextState(Cmd[action.type], [
          action.coordinate,
          state.board,
        ]),
      }),
      state,
      action.dispatch
    );
    return state; // { ...state };
  }
  switch (action.type) {
    case 'setLevel':
      setBoardAction(() => createGame(action.level), state, action.dispatch);
      return { ...state, loading: true };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        loading: false,
      };
    case 'setScalingFactor':
      return {
        ...state,
        scalingFactor: getMaxScalingFactor(state),
      };
    case 'toggleRotated':
      // setBoardAction(() => ({}), state, action.dispatch);
      return {
        ...state,
        rotated: !state.rotated,
      };
  }
  assertNever(action);
}

// @ts-ignore
function init({ level, containerRef }: any): IState {
  return {
    //...legend(), // ...createGame(level),
    ...createGame(level),
    loading: false,
    containerRef,
    scalingFactor: 1,
    rotated: false,
  };
}

type IProps = { level: Level };

const SvgMinesweeper: React.FC<IProps> = ({ level }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(
    reducer,
    ({ level, containerRef } as unknown) as IState,
    init
  );

  React.useEffect(() => {
    dispatch({ type: 'setScalingFactor' });
  }, []);

  React.useEffect(() => {
    const callback = () => dispatch({ type: 'setScalingFactor' });
    const event = 'resize';
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, []);

  const { board, scalingFactor, rotated } = state;

  const togglePause = () => {
    switch (board.state) {
      case GameState.PAUSED:
      case GameState.PLAYING:
        dispatch({
          type: Cmd[Cmd.TOGGLE_PAUSE] as CmdName,
          coordinate: -1,
          dispatch,
        });
        break;
    }
  };
  const done =
    board.state === GameState.GAME_OVER ||
    board.state === GameState.COMPLETED ||
    board.state === GameState.ERROR;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (done || board.state === GameState.PAUSED) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (board.state === GameState.PAUSED) {
      togglePause();
    } else if (done) {
      dispatch({
        type: 'setLevel',
        level: board.level,
        dispatch,
      });
    }
  };
  const classes = ['SvgMinesweeper'];
  if (rotated) {
    classes.push('SvgMinesweeper__rotated');
  }

  return (
    <div
      style={{
        display: 'block',
      }}
    >
      <div
        style={{
          ['--board-scaling-factor' as any]: `${scalingFactor}`,
        }}
        className={classes.join(' ')}
        ref={state.containerRef}
        onPointerDown={handlePointerDown}
        onContextMenu={onContextMenu}
      >
        <ErrorBoundary>
          <SvgBoard dispatch={dispatch} board={board} rotated={rotated} />
        </ErrorBoundary>
        {done ? (
          <div className="GameOver">
            <h1>{GameState[board.state]}</h1>
          </div>
        ) : (
          undefined
        )}
      </div>
    </div>
  );
};

export default SvgMinesweeper;
