import React, { useCallback, useState } from 'react';
import { CellState, GameState, GridType, Level } from '../Game';

import './LevelChooser.scss';
import SvgCell from './Board/SvgCell';

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
  level: Level;
  onChange: (level: Level) => void;
};

export const LevelChooser: React.FC<LevelChooserProps> = ({
  onChange,
  level: initialLevel,
}) => {
  const [level, setLevel] = useState(initialLevel);
  const { rows, cols, mines, type } = level;

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setLevel({
        ...level,
        type: (GridType[e.currentTarget.value as any] as unknown) as GridType,
      }),
    [level]
  );

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
            onChange={e => {
              setLevel(getLevel(e.target.value, level.type));
            }}
          >
            <option hidden disabled />
            {Object.keys(LEVELS).map(k => (
              <option
                value={k}
                key={k}
              >{`${LEVELS[k].cols} x ${LEVELS[k].rows} (${LEVELS[k].mines})`}</option>
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
              min={3}
              max={30}
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
              min={3}
              max={30}
              type="range"
              value={cols}
              name="cols"
            />
          </label>
          <label>
            Mines: {mines} ({((100 * mines) / (rows * cols)).toFixed(1)}%)
            <input
              min={1}
              max={rows * cols}
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
      </form>
    </div>
  );
};
