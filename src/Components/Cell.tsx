import * as React from 'react';
import { NumThreats, CellState, GameState, Mine } from '../Game';

type IProps = {
  content: string | NumThreats;
  disabled?: boolean;
  onPointerUp?: (e: React.MouseEvent) => void;
  state: [CellState, GameState];
  threats: NumThreats | Mine;
};

const Cell: React.FC<IProps> = ({
  content,
  disabled,
  onPointerUp,
  state,
  threats,
}) => {
  const [cellState, gameState] = state;
  return (
    <button
      data-state={CellState[cellState]}
      data-threats={
        cellState === CellState.OPEN || gameState === GameState.GAME_OVER
          ? threats
          : undefined
      }
      className="Cell"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Cell;
