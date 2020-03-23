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
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer, Dispatch } from 'react';
import Board from './Board';

type ILevels = {
  [keyof: string]: Level;
};

const LEVELS: ILevels = {
  BEGINNER: { rows: 8, cols: 8, mines: 10 },
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
      board: GameRecord;
    }
  | CmdAction;

function setBoardAction(
  f: () => object,
  state: IState,
  dispatch: Dispatch<Action>
) {
  new Promise<IState>((resolve, _reject) => {
    const s = { ...state, ...f() };
    resolve(s);
  })
    .then(s => dispatch({ type: 'setBoard', board: s.board }))
    .catch(err => ({
      ...state,
      board: state.board.set('error', err).set('state', GameState.ERROR),
    }));
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
      return { ...state, board: action.board, loading: false };
  }
  // assertNever(action);
}

const initialState = { ...createGame(LEVELS.BEGINNER), loading: false };

const Minesweeper: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { board, loading } = state;
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
  const renderPause = () => {
    return board.state === GameState.PAUSED ? (
      <main className="Minesweeper overlay" onClick={togglePause}>
        <header>
          <h1>Pause</h1>
        </header>
      </main>
    ) : (
      <></>
    );
  };
  return (
    <div style={{ display: 'flex' }}>
      <div>
        <aside className="Control">
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
          <select
            onChange={e => {
              const level = getLevel(e.target.value);
              dispatch({ type: 'setLevel', level, dispatch });
            }}
          >
            {Object.keys(LEVELS).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
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
          ['--board-columns' as any]: cols,
          ['--board-rows' as any]: rows,
        }}
        className="Minesweeper"
        data-state={GameState[board.state]}
      >
        {renderPause()}
        <ErrorBoundary>
          <Board dispatch={dispatch} board={board} />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Minesweeper;
