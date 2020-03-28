import React, { FC, Dispatch } from 'react';
import './Row.css';
import {
  Coordinate,
  NumThreats,
  isNumThreats,
  CellRecord,
  GameState,
  CellState,
  Mine,
} from '../../Game';
import { Action } from '../Minesweeper';
import Cell from './Cell';

type IProps = {
  cells: Array<[Coordinate, CellRecord]>;
  gameState: GameState;
  dispatch: Dispatch<Action>;
  getContent: (
    state: CellState,
    threats: NumThreats | Mine,
    gameState: GameState
  ) => string | NumThreats;
};

const Row: FC<IProps> = ({ cells, dispatch, getContent, gameState }) => (
  <div className="Row">
    {[...cells].map(([index, { threatCount, state }]) => (
      <Cell
        coordinate={index}
        key={index}
        dispatch={dispatch}
        content={getContent(state, threatCount, gameState)}
        state={state}
        threats={isNumThreats(threatCount) ? threatCount : undefined}
        mined={threatCount === 0xff}
      />
    ))}
  </div>
);

export default React.memo(Row);
