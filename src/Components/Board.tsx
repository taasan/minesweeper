import * as React from 'react';
import './Board.css';
import {
  CellState,
  GameState,
  NumThreats,
  Mine,
  GameRecord,
  assertNever,
  isNumThreats,
  randomInt,
} from '../Game';
import { Dispatch } from 'react';
import { Action } from './Minesweeper';
import Cell from './Cell';

type IProps = {
  board: GameRecord;
  dispatch: Dispatch<Action>;
};

const Board: React.FC<IProps> = (props: IProps) => {
  const { board, dispatch } = props;

  const boardState = board.state;
  switch (board.state) {
    case GameState.ERROR:
      const error = board.error != null ? board.error.message : 'Unknown error';
      const cause =
        board.error != null &&
        board.error.cause != null &&
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        board.error.cause.message ? (
          <p>{board.error.cause.message}</p>
        ) : (
          undefined
        );
      return (
        <main className="Error">
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          <p>{error}</p>
          <section>
            <h2>Cause</h2>
            {/* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions*/}
            {cause || 'unknown'}
          </section>
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
  const { cols, rows } = board.level;
  return (
    <div
      className="Board"
      style={{
        ['--board-columns' as any]: cols,
        ['--board-rows' as any]: rows,
      }}
      data-state={GameState[board.state]}
    >
      {[...board.cells.entries()].map(
        ([index, { threatCount: threats, state: cellState }]) => {
          return (
            <Cell
              coordinate={index}
              key={index}
              dispatch={dispatch}
              content={getContent(cellState, threats, boardState)}
              state={cellState}
              threats={isNumThreats(threats) ? threats : undefined}
              mined={threats === 0xff}
            />
          );
        }
      )}
    </div>
  );
};

function getContent(
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
    return getContent(CellState.OPEN, threats, GameState.PLAYING);
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

export default Board;
