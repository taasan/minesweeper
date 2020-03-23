import React, {
  PointerEvent,
  FC,
  useState,
  PointerEventHandler,
  Dispatch,
  SetStateAction,
  memo,
  useMemo,
} from 'react';
import './Cell.css';
import { NumThreats, CellState, CmdName, Mine, randomInt } from '../Game';

import { Action } from './Minesweeper';

type IProps = {
  coordinate: number;
  dispatch: Dispatch<Action>;
  content: string | NumThreats;
  state: CellState;
  threats: NumThreats | Mine;
  done: boolean;
};

type CellStateName = keyof typeof CellState;

type ICellProps = {
  className: string;
  'data-state'?: CellStateName;
  'data-pressed'?: true;
  'data-disabled'?: true;
  role: 'button';
  'data-mined'?: true;
  'data-mine-type'?: number;
  'data-threats'?: NumThreats;
};

const createHandlers = (
  setPressed: Dispatch<SetStateAction<boolean>>,
  handlePointerDown: PointerEventHandler,
  handlePointerUp: PointerEventHandler,
  handlePointerOver: PointerEventHandler
) => ({
  onPointerUp: handlePointerUp,
  onPointerDown: handlePointerDown,
  onPointerLeave: (() => setPressed(false)) as PointerEventHandler,
  onPointerOver: handlePointerOver,
});

const Cell: FC<IProps> = props => {
  console.log('Rendering: Cell');
  const [pressed, setPressed] = useState(false);
  const random = useMemo(() => randomInt(10), []);

  const cellProps: ICellProps = {
    className: 'Cell',
    role: 'button',
    'data-state': 'NEW',
    'data-pressed': pressed ? true : undefined,
  };

  const { dispatch, state, coordinate } = props;

  cellProps['data-state'] = CellState[state] as CellStateName;

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
    if (pressed) {
      setPressed(() => false);
      if (dispatch != null) {
        dispatch({
          type: getCommand(e),
          coordinate: coordinate,
          dispatch,
        });
      }
    }
  };
  const { threats, content, done } = props;

  const okToSetPressed = done
    ? false
    : [CellState.NEW, CellState.FLAGGED, CellState.UNCERTAIN].includes(state) ||
      (state === CellState.OPEN && threats !== 0);

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setPressed(() => okToSetPressed);
  };

  const handlePointerOver = (e: PointerEvent) => {
    setPressed(e.buttons > 0 && okToSetPressed);
  };

  const handlers = done
    ? {}
    : createHandlers(
        setPressed,
        handlePointerDown,
        handlePointerUp,
        handlePointerOver
      );

  const mined = threats === 0xff;
  cellProps['data-mined'] = done && mined ? true : undefined;
  cellProps['data-mine-type'] = done && mined ? random : undefined;
  cellProps['data-threats'] = threats as NumThreats;
  // threats === 0xff || state !== CellState.OPEN ? undefined : threats;

  return (
    <div {...handlers} {...cellProps}>
      <span>{content}</span>
    </div>
  );
};

export default memo(Cell);
