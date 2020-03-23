import * as React from 'react';
import './Minesweeper.css';
import Cell from './Cell';
import {
  CellState,
  GameState,
  Level,
  NumThreats,
  Mine,
  GameRecord,
  Cmd,
  createGame,
  NextStateFunction,
  assertNever,
  CmdName,
  isCmdName,
  calculateIndex,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer, Dispatch } from 'react';

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
        {renderBoard(board, dispatch)}
      </div>
    </div>
  );
};

function renderBoard(
  board: GameRecord,
  dispatch: Dispatch<Action>
): JSX.Element {
  const boardState = board.state;
  const gameOver = boardState === GameState.GAME_OVER;
  switch (board.state) {
    case GameState.ERROR:
      return (
        <main>
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          {board.error != null ? board.error.message : 'Unknown error'}
        </main>
      );
    case GameState.NOT_INITIALIZED:
    case GameState.COMPLETED:
    case GameState.GAME_OVER:
    case GameState.INITIALIZED:
    case GameState.PLAYING:
    case GameState.PAUSED:
      break;
    default:
      return assertNever(board.state);
  }

  return (
    <ErrorBoundary>
      <div onPointerDown={e => e.preventDefault()} className="Board">
        {[...board.cells.entries()].map(
          ([coordinate, { threatCount: threats, state }]) => {
            return (
              <Cell
                coordinate={calculateIndex(board.level.cols, coordinate)}
                key={`${coordinate.row}-${coordinate.col}`}
                dispatch={dispatch}
                content={render(state, threats, boardState)}
                state={state}
                threats={threats}
                done={
                  (threats === 0xff ||
                    (state !== CellState.NEW && state !== CellState.OPEN)) &&
                  (gameOver || boardState === GameState.COMPLETED)
                }
              />
            );
          }
        )}
      </div>
    </ErrorBoundary>
  );
}

function render(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
): string | NumThreats {
  const [disarmedMine, explodedMine] = ['💣', '💥'];
  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const done = gameOver || gameWon;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && (gameWon || (gameOver && isFlagged));

  if (isDisarmed) {
    return disarmedMine;
  }
  if (gameOver && state !== CellState.EXPLODED && threats === 0xff) {
    return explodedMine;
  }
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return render(CellState.OPEN, threats, GameState.PLAYING);
  }
  switch (state) {
    case CellState.FLAGGED:
      return gameOver && !isMined ? '❌' : '🚩';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return threats === 0xff ? disarmedMine : threats;
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}

export default Minesweeper;
