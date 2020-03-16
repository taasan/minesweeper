import * as React from 'react';
import { NumThreats, CellState } from '../Game';

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
      data-state={CellState[state]}
      data-threats={state === CellState.OPEN ? threats : undefined}
      className="Cell"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Cell;
