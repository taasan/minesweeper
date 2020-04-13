import React, { useCallback, useState } from 'react';
import {
  CellState,
  GameState,
  GridType,
  Level,
  MAX_LEVEL,
  MIN_LEVEL,
  maxMines,
  minMines,
} from '../Game';

import './LevelChooser.scss';
import SvgCell from './Board/SvgCell';
import { CloseButton } from './CloseButton';

interface LevelLite extends Omit<Level, 'type'> {}

// const predefinedLevels: ReadonlyMap<string, Readonly<LevelLite>> = new Map();
const predefinedLevels = Object.freeze([
  Object.freeze({ rows: 6, cols: 10, mines: 10, name: 'Beginner' }),
  Object.freeze({ rows: 16, cols: 16, mines: 40, name: 'Intermediate' }),
  Object.freeze({ mines: 99, rows: 16, cols: 30, name: 'Expert' }),
]);

export const getLevel = (
  key: string = 'Beginner',
  type: GridType = GridType.SQUARE
): Level => {
  const lvl = predefinedLevels.find(l => l.name === key);
  const v = lvl != null ? lvl : predefinedLevels[0];
  return Object.freeze({ ...v, type });
};

const compareLevels = (a: LevelLite | Level, b: LevelLite | Level) =>
  a.cols === b.cols && a.rows === b.rows && a.mines === b.mines;

type LevelChooserProps = {
  level: Level;
  onChange: (level: Level) => void;
  onCancel(): void;
};

export const LevelChooser: React.FC<LevelChooserProps> = ({
  onChange,
  level: initialLevel,
  onCancel,
}) => {
  const [level, setLevel] = useState(initialLevel);
  const { rows, cols, mines, type } = level;
  const maxM = maxMines({ rows, cols });
  const minM = minMines({ rows, cols });
  if (level.mines > maxM) {
    setLevel({
      ...level,
      mines: maxM,
    });
  } else if (level.mines < minM) {
    setLevel({
      ...level,
      mines: minM,
    });
  }

  const selectedLevel = predefinedLevels.find(v => compareLevels(level, v))
    ?.name;

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setLevel({
        ...level,
        type: (GridType[e.currentTarget.value as any] as unknown) as GridType,
      }),
    [level]
  );

  const custom = 'Custom';

  const formatLevel = (v: LevelLite & { name: string }) =>
    `${v.name}: ${v.cols} x ${v.rows} (${v.mines})`;

  return (
    <div className="LevelChooser">
      <form
        onSubmit={e => {
          e.preventDefault();
          onChange(level);
        }}
        onReset={e => {
          e.preventDefault();
          setLevel(initialLevel);
        }}
      >
        <fieldset>
          <legend>Select level</legend>
          <select
            value={selectedLevel ?? custom}
            onChange={e => {
              setLevel(getLevel(e.target.value, level.type));
            }}
          >
            <option hidden={selectedLevel != null} value={custom}>
              {formatLevel({ name: custom, cols, rows, mines })}
            </option>
            {[...predefinedLevels.entries()].map(([k, v]) => (
              <option value={v.name} key={k}>
                {formatLevel(v)}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset>
          <legend>Custom level</legend>
          <label>
            Rows: {rows}
            <input
              onChange={e =>
                setLevel({
                  ...level,
                  rows: e.currentTarget.valueAsNumber,
                })
              }
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              type="range"
              value={rows}
              name="rows"
            />
          </label>
          <label>
            Columns: {cols}
            <input
              onChange={e =>
                setLevel({
                  ...level,
                  cols: e.currentTarget.valueAsNumber,
                })
              }
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              type="range"
              value={cols}
              name="cols"
            />
          </label>
          <label>
            Mines: {mines} ({((100 * mines) / (rows * cols)).toFixed(1)}%)
            <input
              min={minM}
              max={maxM}
              type="range"
              value={mines}
              name="mines"
              onChange={e =>
                setLevel({
                  ...level,
                  mines: e.currentTarget.valueAsNumber,
                })
              }
            />
          </label>
          <button
            disabled={rows === cols}
            type="button"
            onClick={() =>
              setLevel({
                ...level,
                rows: level.cols,
                cols: level.rows,
              })
            }
          >
            Swap rows and columns
          </button>
        </fieldset>
        <fieldset>
          <legend>Grid type</legend>
          {Object.keys(GridType)
            .filter(name => isNaN(Number(name)))
            .map(name => {
              const checked = name === GridType[type];
              const state = checked ? CellState.OPEN : CellState.NEW;
              const content = checked ? '✓' : '';
              return (
                <label className="RadioGroup__Option" key={name}>
                  <input
                    onChange={handleTypeChange}
                    checked={checked}
                    type="radio"
                    name="type"
                    value={name}
                  />
                  <div
                    className="SvgBoard"
                    data-state={GameState[GameState.GAME_OVER]}
                    style={{
                      width: '32px',
                      height: 'auto',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  >
                    {' '}
                    <SvgCell
                      threats={2}
                      content={content}
                      coordinate={0}
                      mined={false}
                      state={state}
                      gridType={(GridType[name as any] as unknown) as GridType}
                    />
                  </div>
                </label>
              );
            })}
        </fieldset>
        <button type="submit">OK</button>
        <button type="reset">Reset</button>
        <CloseButton close={onCancel} text="Cancel" />
      </form>
    </div>
  );
};
