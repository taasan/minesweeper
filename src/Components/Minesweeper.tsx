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
  randomInt,
  Coordinate,
  NextStateFunction,
  assertNever,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';

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

const Minesweeper: React.FC = () => {
  const [level, setLevel] = React.useState(LEVELS.BEGINNER);
  const [[board, nextState], setBoard] = React.useState(() =>
    createGame(level)
  );
  // const [seconds, setSeconds] = React.useState(0);
  /*

  React.useEffect(() => {
    const interval = setInterval(() => {
      switch (board.state) {
        case GameState.PLAYING:
          setSeconds(s => s + 1);
          break;
        case GameState.PAUSED:
          break;
        default:
          clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [board.state]);
  */
  const { rows, cols, mines } = board.level;
  const togglePause = () => {
    switch (board.state) {
      case GameState.PAUSED:
      case GameState.PLAYING:
        setBoard([
          nextState(Cmd.TOGGLE_PAUSE, [
            new Coordinate({ row: -1, col: -1 }),
            board,
          ]),
          nextState,
        ]);
        break;
    }
  };
  /*
  if (board.state === GameState.PAUSED) {
    return ;
  }*/
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
          <button onClick={togglePause}>{GameState[board.state]}</button>
          <select
            onChange={e => {
              const l = getLevel(e.target.value);
              setLevel(l);
              setBoard(createGame(l));
            }}
          >
            {Object.keys(LEVELS).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <button onClick={() => setBoard(createGame(level))}>New</button>
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
        {renderBoard(board, nextState, setBoard)}
      </div>
    </div>
  );
};

function renderBoard(
  board: GameRecord,
  nextState: NextStateFunction,
  setBoard: ([b, n]: [GameRecord, NextStateFunction]) => void
): JSX.Element {
  const gameOver = board.state === GameState.GAME_OVER;
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
          ([
            coordinate,
            { threatCount: threats, state, flaggedNeighboursCount },
          ]) => {
            return (
              <Cell
                key={`${coordinate.row}-${coordinate.col}`}
                onAction={
                  gameOver
                    ? undefined
                    : e => {
                        let newBoard: GameRecord = board;
                        const newGameState = handlePointerUp(
                          e,
                          [coordinate, newBoard],
                          nextState
                        );
                        newBoard = newGameState;
                        setBoard([newBoard, nextState]);
                      }
                }
                content={render(state, threats, board.state)}
                state={[state, board.state]}
                disabled={
                  board.state === GameState.COMPLETED ||
                  board.state === GameState.GAME_OVER ||
                  board.state === GameState.PAUSED
                }
                threats={threats !== 0xff ? threats : undefined}
                flaggedNeighbours={flaggedNeighboursCount}
                mined={threats === 0xff}
                randomMinetype={() => randomInt(10)}
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

function handlePointerUp(
  e: React.MouseEvent,
  [coordinate, board]: [Coordinate, GameRecord],
  nextState: NextStateFunction
): GameRecord {
  const cell = board.cells.get(coordinate)!;
  let command: Cmd;
  if (cell.state === CellState.OPEN) {
    command = Cmd.POKE;
  } else {
    switch (e.button) {
      case 0:
        command = Cmd.POKE;
        break;
      case 2:
        command = Cmd.FLAG;
        break;
      default:
        command = Cmd.NONE;
        break;
    }
  }

  return nextState(command, [coordinate, board]);
}

export default Minesweeper;
