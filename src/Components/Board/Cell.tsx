import React, { FC, Dispatch, memo, useMemo, MouseEvent } from 'react';
import './Cell.css';
import {
  NumThreats,
  CellState,
  CmdName,
  randomInt,
  Coordinate,
} from '../../Game';
import EmojiRegex from 'emoji-regex';

import { Action } from '../Minesweeper';

const emojiRegex = EmojiRegex();

export type ICellProps = {
  coordinate: Coordinate;
  dispatch: Dispatch<Action>;
  content: string | NumThreats;
  state: CellState;
  threats?: NumThreats;
  mined: boolean;
};

const Cell: FC<ICellProps> = props => {
  console.log('Render cell');

  const random = useMemo(() => randomInt(12), []);

  const { dispatch, state, coordinate, threats, content, mined } = props;

  const getCommand = (e: MouseEvent): CmdName => {
    if (state === CellState.OPEN) {
      return 'POKE';
    } else {
      switch (e.button) {
        case 0:
          return 'POKE';
        case 2:
          return 'FLAG';
        default:
          return 'NONE';
      }
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (dispatch != null) {
      dispatch({
        type: getCommand(e),
        coordinate: coordinate,
        dispatch,
      });
    }
  };

  const ariaProps =
    typeof content === 'string' && emojiRegex.test(content)
      ? {
          role: 'img',
          'aria-label': mined ? 'MINE' : CellState[state],
        }
      : {};

  return (
    <div
      role="button"
      onMouseDown={handleClick}
      className="Cell"
      data-state={CellState[state]}
      data-threats={threats}
      data-mined={mined ? true : undefined}
      data-mine-type={mined ? random : undefined}
    >
      <span {...ariaProps}>{content}</span>
      {/*threats === 0 ? undefined : <span {...ariaProps}>{content}</span>*/}
    </div>
  );
};

export default memo(Cell);
