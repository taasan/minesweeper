import React, { PointerEvent, FC, Dispatch, memo, useMemo } from 'react';
import './Cell.css';
import { NumThreats, CellState, CmdName, randomInt } from '../Game';
import EmojiRegex from 'emoji-regex';

import { Action } from './Minesweeper';

const emojiRegex = EmojiRegex();

type ICellProps = {
  coordinate: number;
  dispatch: Dispatch<Action>;
  content: string | NumThreats;
  state: CellState;
  threats?: NumThreats;
  mined: boolean;
};

const Cell: FC<ICellProps> = props => {
  const random = useMemo(() => randomInt(10), []);

  const { dispatch, state, coordinate, threats, content, mined } = props;

  const getCommand = (e: React.PointerEvent): CmdName => {
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

  const handlePointerUp = (e: PointerEvent) => {
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
      onPointerUp={handlePointerUp}
      className="Cell"
      data-state={CellState[state]}
      data-threats={threats}
      data-mined={mined ? true : undefined}
      data-mine-type={mined ? random : undefined}
    >
      <a {...ariaProps}>{content}</a>
    </div>
  );
};

export default memo(Cell);
