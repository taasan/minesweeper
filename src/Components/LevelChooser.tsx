import React, { useRef } from 'react';
import { GridType, Level } from '../Game';

import './LevelChooser.scss';

interface LevelLite extends Omit<Level, 'type'> {}

type ILevels = {
  [keyof: string]: LevelLite;
};

const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10 },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
  EXPERT: { mines: 99, rows: 16, cols: 30 },
};

export const getLevel = (
  key: string = 'BEGINNER',
  type: GridType = GridType.SQUARE
): Level => {
  const lvl = LEVELS[key];
  const v = lvl != null ? lvl : LEVELS.BEGINNER;
  return Object.freeze({ ...v, type });
};

type LevelChooserProps = {
  onChange: (level: Level) => void;
  open: boolean;
};

export const LevelChooser: React.FC<LevelChooserProps> = ({ onChange }) => {
  const rowsRef = useRef<HTMLInputElement>(null);
  const colsRef = useRef<HTMLInputElement>(null);
  const minesRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  return (
    <div className="LevelChooser">
      <div style={{ display: 'inline-block' }}>
        <select
          onChange={e =>
            onChange(
              getLevel(e.target.value, parseInt(typeRef.current?.value!))
            )
          }
        >
          {Object.keys(LEVELS).map(k => (
            <option
              value={k}
              key={k}
            >{`${LEVELS[k].cols} x ${LEVELS[k].rows} (${LEVELS[k].mines})`}</option>
          ))}
        </select>
        <input ref={rowsRef} type="number" defaultValue="7" name="rows" />
        <input ref={colsRef} type="number" defaultValue="11" name="cols" />
        <input ref={minesRef} type="number" defaultValue="13" name="mines" />
        <select ref={typeRef}>
          {Object.keys(GridType)
            .filter(name => isNaN(Number(name)))
            .map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
        </select>

        <button
          onClick={() => {
            const rows = parseInt(rowsRef.current?.value!);
            const cols = parseInt(colsRef.current?.value!);
            const mines = parseInt(minesRef.current?.value!);
            const type = parseInt(typeRef.current?.value!);
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (rows && cols && mines) {
              onChange({
                rows,
                cols,
                mines,
                type,
              });
            }
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};
