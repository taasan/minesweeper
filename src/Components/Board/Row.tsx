import React, { FC, Dispatch } from 'react';
import './Row.css';
import { Coordinate, isNumThreats, CellRecord, GameState } from '../../Game';
import { Action } from '../Minesweeper';
import Cell from './Cell';
import { NumeralSystem, getContent } from './getContent';

type IProps = {
  cells: Array<[Coordinate, CellRecord]>;
  gameState: GameState;
  dispatch: Dispatch<Action>;
  numeralSystem: NumeralSystem;
};

const Row: FC<IProps> = ({ cells, dispatch, gameState, numeralSystem }) => (
  <div className="Row">
    {[...cells].map(([index, { threatCount, state }]) => (
      <Cell
        coordinate={index}
        key={index}
        dispatch={dispatch}
        content={getContent(state, threatCount, gameState, numeralSystem)}
        state={state}
        threats={isNumThreats(threatCount) ? threatCount : undefined}
        mined={threatCount === 0xff}
      />
    ))}
  </div>
);

export default React.memo(Row);
