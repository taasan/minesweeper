import * as React from 'react';
import './SvgBoard.css';
import {
  GameState,
  GameRecord,
  assertNever,
  calculateCoordinate,
  isNumThreats,
  ICell,
  Coordinate,
} from '../../Game';
import { Dispatch } from 'react';
import { Action } from '../SvgMinesweeper';
import { getContent } from './getContent';
import SvgCell from './SvgCell';
import { onContextMenu } from '..';

type IProps = {
  board: GameRecord;
  rotated: boolean;
  dispatch: Dispatch<Action>;
};

const SvgBoard: React.FC<IProps> = (props: IProps) => {
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
  // const { level } = board;
  const { cols, rows } = board.level;
  /*
    const { cols, rows } = !rotated
    ? board.level
    : { rows: level.cols, cols: level.rows };
*/
  const done =
    boardState === GameState.GAME_OVER ||
    boardState === GameState.COMPLETED ||
    boardState === GameState.DEMO ||
    boardState === GameState.ERROR;
  const pointerEvents = done ? 'none' : 'revert';

  const cellSize = 33;
  const width = cellSize * cols;
  const height = cellSize * rows;

  const mapCell = ([index, cell]: [Coordinate, ICell]) => {
    const { row, col } = calculateCoordinate(cols, index);
    const x = col * cellSize;
    const y = row * cellSize;

    return (
      <svg key={index} x={x} y={y} width={cellSize} height={cellSize}>
        <SvgCell
          cellSize={cellSize}
          coordinate={index}
          dispatch={dispatch}
          content={getContent(cell.state, cell.threatCount, boardState)}
          state={cell.state}
          threats={
            isNumThreats(cell.threatCount) ? cell.threatCount : undefined
          }
          mined={cell.threatCount === 0xff}
        />
      </svg>
    );
  };

  const classes = ['SvgBoard'];
  if (rotated) {
    classes.push('SvgBoard__rotated');
  }
  return (
    <svg
      preserveAspectRatio="xMidYMid meet"
      className={classes.join(' ')}
      pointerEvents={pointerEvents}
      viewBox={`0 0 ${width} ${height}`}
      data-state={GameState[boardState]}
      data-state2={
        boardState === GameState.DEMO
          ? GameState[GameState.GAME_OVER]
          : GameState[boardState]
      }
      onContextMenu={onContextMenu}
    >
      <rect x="0" y="0" width="100%" height="100%" />
      {[...board.cells].map(mapCell)}
    </svg>
  );
};

export default React.memo(SvgBoard);
