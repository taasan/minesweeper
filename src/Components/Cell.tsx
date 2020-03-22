import React, {
  PointerEvent,
  MouseEvent,
  FC,
  useState,
  PointerEventHandler,
  Dispatch,
  SetStateAction,
} from 'react';
import './Cell.css';
import { NumThreats, CellState, GameState, assertNever } from '../Game';
import Assert from 'assert';

type IPropsPaused = {
  state: [never, GameState];
};

type IPropsNotInitialized = {
  onAction?: (e: MouseEvent) => void;
  state: [CellState.NEW, GameState];
  disabled: false;
  threats: undefined;
  flaggedNeighbours: undefined;
  content?: string | NumThreats;
};

const isPaused = (props: IProps): props is IPropsPaused =>
  props.state[1] === GameState.PAUSED;

const isNotInitialized = (props: IProps): props is IPropsNotInitialized =>
  props.state[1] === GameState.NOT_INITIALIZED;

type IPropsPlaying = {
  content: string | NumThreats;
  disabled: boolean;
  onAction?: (e: MouseEvent) => void;
  state: [CellState, GameState];
  threats?: NumThreats;
  flaggedNeighbours?: NumThreats;
};

const isPlaying = (props: IProps): props is IPropsPlaying =>
  props.state[1] === GameState.PLAYING;

type IPropsDone = {
  content: string | NumThreats;
  disabled: boolean;
  onAction?: (e: MouseEvent) => void;
  state: [CellState, GameState];
  threats?: NumThreats;
  flaggedNeighbours?: NumThreats;
  mined: boolean;
  randomMinetype: () => number;
};

const isDone = (props: IProps): props is IPropsDone => {
  const state = props.state[1];
  return state === GameState.GAME_OVER || state === GameState.COMPLETED;
};

type IProps = IPropsPaused | IPropsPlaying | IPropsDone | IPropsNotInitialized;

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
  disabled: boolean,
  setPressed: Dispatch<SetStateAction<boolean>>,
  handlePointerDown: PointerEventHandler,
  handlePointerUp: PointerEventHandler,
  handlePointerOver: PointerEventHandler
) => ({
  onPointerUp: disabled ? undefined : handlePointerUp,
  onPointerDown: disabled ? undefined : handlePointerDown,
  onPointerLeave: disabled
    ? undefined
    : ((() => setPressed(false)) as PointerEventHandler),
  onPointerOver: disabled ? undefined : handlePointerOver,
});

const Cell: FC<IProps> = props => {
  Assert.equal(
    [
      isPaused(props),
      isPlaying(props),
      isDone(props),
      isNotInitialized(props),
    ].reduce((p, c) => (c ? p + 1 : p), 0),
    1,
    'Illegal state'
  );

  const [pressed, setPressed] = useState(false);
  const [random, setRandom] = useState(undefined as number | undefined);

  const cellProps: ICellProps = {
    className: 'Cell',
    role: 'button',
    'data-state': 'NEW',
    'data-pressed': pressed ? true : undefined,
  };

  if (isPaused(props)) {
    return (
      <div {...cellProps}>
        <span>&nbsp;</span>
      </div>
    );
  }

  const { onAction, state } = props;

  const [cellState, gameState] = state;
  cellProps['data-state'] = CellState[cellState] as CellStateName;

  const handlePointerUp = (e: PointerEvent) => {
    if (pressed) {
      setPressed(() => false);
      if (onAction != null) {
        onAction(e);
      }
    }
  };
  const { disabled, threats, content } = props;

  const okToSetPressed =
    [CellState.NEW, CellState.FLAGGED, CellState.UNCERTAIN].includes(
      cellState
    ) ||
    (cellState === CellState.OPEN && threats !== 0);

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setPressed(() => okToSetPressed);
  };

  const handlePointerOver = (e: PointerEvent) => {
    if (disabled) {
      return;
    }
    setPressed(e.buttons > 0 && okToSetPressed);
  };

  const handlers = createHandlers(
    disabled,
    setPressed,
    handlePointerDown,
    handlePointerUp,
    handlePointerOver
  );

  if (isNotInitialized(props)) {
    return (
      <div {...cellProps} {...handlers}>
        <span>&nbsp;</span>
      </div>
    );
  }

  const open = cellState === CellState.OPEN;

  cellProps['data-disabled'] = disabled ? true : undefined;

  const dataThreats =
    open || gameState === GameState.GAME_OVER ? threats : undefined;

  if (isDone(props)) {
    if (random == null) {
      setRandom(props.randomMinetype());
    }
    cellProps['data-mined'] = props.mined ? true : undefined;
    cellProps['data-mine-type'] = props.mined ? random : undefined;
    return renderDone();
  }

  if (isPlaying(props)) {
    return renderDone();
  }
  assertNever(props);

  function renderDone() {
    return (
      <div {...handlers} {...cellProps} data-threats={dataThreats}>
        <span>{content}</span>
      </div>
    );
  }
};

export default Cell;
