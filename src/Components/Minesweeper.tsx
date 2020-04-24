import React from 'react';
import { GameRecord } from '../Game';
import { CmdAction } from '../store';

type BoardProps = {
  board: GameRecord;
  rotated: boolean;
  dispatch?: React.Dispatch<CmdAction>;
  style?: React.CSSProperties;
};

type Board = React.FC<BoardProps>;

// TODO Flytt funksjonaliteten hit fra SvgMinesweeper

type Props = {
  Board: Board;
};

const Minesweeper: React.FC<Props> = (_props: Props) => {
  return <div className="Minesweeper" />;
};

export default Minesweeper;
