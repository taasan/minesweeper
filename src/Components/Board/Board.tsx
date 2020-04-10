import * as React from 'react';
import './Board.css';
import { GameState, GameRecord, assertNever } from '../../Game';
import { Dispatch } from 'react';
import { Action } from '../Minesweeper';
import Row from './Row';
import { NumeralSystem } from './getContent';
import { onContextMenu } from '..';

type IProps = {
  board: GameRecord;
  rotated: boolean;
  dispatch: Dispatch<Action>;
};

const Board: React.FC<IProps> = (props: IProps) => {
  console.log('Render board');
  const { board, dispatch, rotated } = props;

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
    case GameState.DEMO:
      break;
    default:
      return assertNever(board.state);
  }
  const { cols, rows } = board.level;
  const done =
    boardState === GameState.GAME_OVER ||
    boardState === GameState.COMPLETED ||
    boardState === GameState.DEMO ||
    boardState === GameState.ERROR;
  const pointerEvents = done ? 'none' : 'initial';
  return (
    <div
      onContextMenu={onContextMenu}
      className="Board"
      style={{
        pointerEvents,
        ['--board-columns' as any]: rotated ? rows : cols,
        ['--board-rows' as any]: rotated ? cols : rows,
        gridAutoFlow: rotated ? 'column' : 'row',
      }}
      data-state={
        boardState === GameState.DEMO
          ? GameState[GameState.GAME_OVER]
          : GameState[board.state]
      }
    >
      {[...new Array(rows)].map((_, row) => {
        const from = row + row * (cols - 1);
        const to = from + cols;
        return (
          <Row
            key={row}
            cells={[...board.cells.slice(from, to)]}
            dispatch={dispatch}
            gameState={boardState}
            numeralSystem={NumeralSystem.ascii}
          />
        );
      })}
    </div>
  );
};

export default React.memo(Board);
