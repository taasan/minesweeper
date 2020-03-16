import * as React from 'react';
import { NumThreats, CellState } from '../Game/Board';

type IProps = {
  content: string | NumThreats;
  disabled?: boolean;
  onPointerUp?: (e: React.MouseEvent) => void;
  state: CellState;
  threats: NumThreats | undefined;
};

const Cell: React.FC<IProps> = ({
  content,
  disabled,
  onPointerUp,
  state,
  threats,
}) => {
  return (
    <button
      data-state={state}
      data-threats={state === 'OPEN' ? threats : undefined}
      className="Cell"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
/*
type IProps = {
  gameOver: boolean;
  threats: NumThreats | Mine;
  x: number;
  y: number;
  onGameOver: (p: Coordinate) => void;
  render: (state: State) => HTMLElement | string | NumThreats;
  className?: string;
};

const Cell2: React.FC<IProps> = ({
  threats,
  onGameOver,
  render,
  x,
  y,
  gameOver,
  className,
}) => {
  const [state, setState] = React.useState<State>('NEW');
  React.useEffect(() => {
    if (!gameOver && state === 'OPEN' && threats === 0xff) {
      onGameOver({ x, y });
    }
  }, [gameOver, onGameOver, state, threats, x, y]);

  return gameOver ? (
    <button disabled className={className}>
      {render(state)}
    </button>
  ) : (
    <button
      className={className}
      onPointerUp={(e: React.MouseEvent) => setState(handlePointerUp(e, state))}
      disabled={state === 'OPEN'}
    >
      {render(state)}
    </button>
  );
};

function handlePointerUp(e: React.MouseEvent, oldState: State): State {
  if (oldState === 'OPEN') {
    throw new Error(`Illegal state ${oldState}`);
  }
  switch (e.button) {
    case 0:
      if (oldState === 'NEW' || oldState === 'UNCERTAIN') {
        return 'OPEN';
      }
      return oldState;
    case 2:
      switch (oldState) {
        case 'FLAGGED':
          return 'UNCERTAIN';
        case 'UNCERTAIN':
          return 'NEW';
        case 'NEW':
          return 'FLAGGED';
      }
  }
  return oldState;
}
*/
export default Cell;
