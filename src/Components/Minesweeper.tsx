import * as React from 'react';
import './Minesweeper.css';
import {
  CellState,
  GameState,
  Level,
  GameRecord,
  Cmd,
  createGame,
  NextStateFunction,
  CmdName,
  isCmdName,
  legend,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer, Dispatch, useCallback, useRef } from 'react';
import Board from './Board/Board';
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

export const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10 },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
  EXPERT: { mines: 99, rows: 16, cols: 30 },
};

const getLevel = (key: string) => {
  const lvl = LEVELS[key];
  const v = lvl != null ? lvl : undefined;
  return v != null ? v : LEVELS.BEGINNER;
};

type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  scalingFactor: number;
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
    const boardElement = current.querySelector('.Board');

    if (boardElement == null) {
      return 1;
    }
    // const { clientWidth, clientHeight } = current;
    const { clientWidth, clientHeight } = document.documentElement;
    const width = boardElement.clientWidth;
    const height = boardElement.clientHeight;

    const a = Math.min(clientHeight, current.clientHeight) / height;
    const b = Math.min(clientWidth, current.clientWidth) / width;
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
  }
  // assertNever(action);
}

// @ts-ignore
function init({ level, containerRef }: any): IState {
  return {
    ...legend(), // ...createGame(level),
    loading: false,
    containerRef,
    scalingFactor: 1,
  };
}

type IProps = { level: Level };
type LevelChooserProps = {
  onChange: (level: Level) => void;
};
const LevelChooser: React.FC<LevelChooserProps> = React.memo(({ onChange }) => {
  console.log('Render LevelChooser');
  const rowsRef = useRef<HTMLInputElement>(null);
  const colsRef = useRef<HTMLInputElement>(null);
  const minesRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: 'inline-block' }}>
      <select
        className="LevelChooser"
        onChange={e => onChange(getLevel(e.target.value))}
      >
        {Object.keys(LEVELS).map(k => (
          <option
            value={k}
            key={k}
          >{`${LEVELS[k].cols} x ${LEVELS[k].rows} (${LEVELS[k].mines})`}</option>
        ))}
      </select>
      <input ref={rowsRef} type="number" defaultValue="7" name="rows" />
      <input ref={colsRef} type="number" defaultValue="11" name="cols" />
      <input ref={minesRef} type="number" defaultValue="13" name="mines" />
      <button
        onClick={() => {
          const rows = parseInt(rowsRef.current?.value!);
          const cols = parseInt(colsRef.current?.value!);
          const mines = parseInt(minesRef.current?.value!);
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (rows && cols && mines) {
            onChange({
              rows,
              cols,
              mines,
            });
          }
        }}
      >
        OK
      </button>
    </div>
  );
});

const Minesweeper: React.FC<IProps> = ({ level }) => {
  const [rotated, setRotated] = React.useState(false);
  const rotateRef = useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(
    reducer,
    ({ level, containerRef } as unknown) as IState,
    init
  );

  const onLevelChange = useCallback(l => {
    dispatch({
      type: 'setLevel',
      level: l,
      dispatch,
    });
  }, []);

  React.useEffect(() => {
    dispatch({ type: 'setScalingFactor' });
  }, [containerRef, rotated]);

  React.useEffect(() => {
    const callback = () => dispatch({ type: 'setScalingFactor' });
    const event = 'resize';
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, []);

  const { board, loading, scalingFactor } = state;
  const { rows, cols, mines } = board.level;

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

  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <div>
        <aside className="Control">
          <input
            checked={rotated}
            ref={rotateRef}
            type="checkbox"
            onClick={() => setRotated(!rotated)}
          />
          {/*<button>{seconds}</button>*/}
          <button>
            {cols * rows - mines - board.cellStates[CellState.OPEN]}
          </button>
          <button>{board.cellStates[CellState.OPEN]}</button>
          <button>
            {board.level.mines -
              board.cellStates[CellState.FLAGGED] -
              board.cellStates[CellState.UNCERTAIN]}
          </button>
          <button onClick={togglePause}>
            {loading ? 'LOADING' : GameState[board.state]}
          </button>
          <LevelChooser onChange={onLevelChange} />
          <button
            onClick={() =>
              dispatch({ type: 'setLevel', level: board.level, dispatch })
            }
          >
            New
          </button>
        </aside>
      </div>
      <div
        style={{
          ['--board-scaling-factor' as any]: `${scalingFactor}`,
        }}
        className="Minesweeper"
        ref={state.containerRef}
        onPointerDown={handlePointerDown}
      >
        <ErrorBoundary>
          <Board dispatch={dispatch} board={board} rotated={rotated} />
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

export default Minesweeper;
