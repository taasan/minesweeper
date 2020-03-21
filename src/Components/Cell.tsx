import React, { PointerEvent, MouseEvent, FC, useState } from 'react';
import './Cell.css';
import { NumThreats, CellState, GameState, randomInt } from '../Game';

type IProps = {
  content: string | NumThreats;
  disabled: boolean;
  mined: boolean;
  onAction?: (e: MouseEvent) => void;
  state: [CellState, GameState];
  threats?: NumThreats;
};

const Cell: FC<IProps> = ({
  content,
  disabled,
  onAction,
  state,
  threats,
  mined,
}) => {
  const [cellState, gameState] = state;
  const [pressed, setPressed] = useState(false);
  const [random, setRandom] = useState(undefined as number | undefined);
  const handlePointerUp = (e: PointerEvent) => {
    if (pressed) {
      setPressed(false);
      if (onAction != null) {
        onAction(e);
      }
    }
  };
  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setPressed(true);
  };

  const done =
    gameState === GameState.GAME_OVER || gameState === GameState.COMPLETED;

  const dataMined = done && mined ? true : undefined;

  const dataThreats =
    cellState === CellState.OPEN || gameState === GameState.GAME_OVER
      ? threats
      : undefined;
  if (random == null && done) {
    setRandom(randomInt(10));
  }

  return gameState === GameState.PAUSED ? (
    <div className="Cell" />
  ) : (
    <div
      role="button"
      data-state={CellState[cellState]}
      data-mined={dataMined}
      data-mine-type={done && mined ? random : undefined}
      data-threats={dataThreats}
      className="Cell"
      onPointerUp={disabled ? undefined : handlePointerUp}
      data-disabled={disabled}
      data-pressed={pressed ? pressed : undefined}
      onPointerDown={disabled ? undefined : handlePointerDown}
      onPointerOver={disabled ? undefined : e => setPressed(e.buttons > 0)}
      onPointerLeave={disabled ? undefined : () => setPressed(false)}
    >
      <span>{content}</span>
    </div>
  );
};

export default Cell;
