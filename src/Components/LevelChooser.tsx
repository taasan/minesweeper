import React, { useCallback, useContext, useState } from 'react';
import {
  CellState,
  GameState,
  GridType,
  Level,
  MAX_LEVEL,
  MIN_LEVEL,
  Topology,
  fromObject,
  maxMines,
  minMines,
} from '../Game';

import './LevelChooser.scss';
import SvgCell from './Svg/Board/SvgCell';
import CloseButton from './CloseButton';
import FormatNumber from './FormatNumber';
import { NumeralSystem, formatNumber } from '../lib';
import { NumeralSystemContext } from '../store/contexts/settings';
import { Store } from '../store';
import { navigate } from '../router';

interface LevelLite extends Omit<Level, 'type' | 'topology'> {}

// const predefinedLevels: ReadonlyMap<string, Readonly<LevelLite>> = new Map();
const predefinedLevels = Object.freeze([
  Object.freeze({ rows: 6, cols: 10, mines: 10, name: 'Beginner' }),
  Object.freeze({ rows: 16, cols: 16, mines: 40, name: 'Intermediate' }),
  Object.freeze({ mines: 99, rows: 16, cols: 30, name: 'Expert' }),
]);

export const getLevel = (
  key: string = 'Beginner',
  type: GridType = GridType.SQUARE,
  topology = Topology.LIMITED
): Level => {
  const lvl = predefinedLevels.find(l => l.name === key);
  const v = lvl != null ? lvl : predefinedLevels[0];
  return Object.freeze({ ...v, type, topology });
};

const compareLevels = (a: LevelLite | Level, b: LevelLite | Level) =>
  a.cols === b.cols && a.rows === b.rows && a.mines === b.mines;

type LevelChooserProps = {
  onChange: (level: Level) => void;
};

const custom = 'Custom';

const formatLevel = ({
  rows,
  cols,
  mines,
  numeralSystem,
  name,
  asString,
}: LevelLite & {
  name?: string;
  numeralSystem: NumeralSystem;
  asString?: boolean;
}) => {
  if (asString === true) {
    const [r, c, m] = [rows, cols, mines].map(n =>
      formatNumber(numeralSystem, n)
    );
    return (name != null ? `${name} : ` : '') + `${c} / ${r} (${m})`;
  }
  return (
    <>
      {name != null ? `${name}: ` : ''}
      <FormatNumber numeralSystem={numeralSystem} n={rows} />
      {' / '}
      <FormatNumber numeralSystem={numeralSystem} n={cols} />
      {' ('}
      <FormatNumber numeralSystem={numeralSystem} n={mines} />
      {')'}
    </>
  );
}; /*
  (v.name != null ? `${v.name}: ` : '') +
  [v.rows, v.cols, v.mines]
    .map(n => formatNumber(v.numeralSystem, n))
    .join('; ');
    */
// `${v.name}: ${v.cols} x ${v.rows} (${v.mines})`;

export const LevelChooser: React.FC<LevelChooserProps> = ({ onChange }) => {
  const { numeralSystem } = useContext(NumeralSystemContext);
  const { state: context } = useContext(Store);
  const initialLevel: Level = context.game.board.level;
  // const numeralSystem = initialState.numeralSystem;
  const [level, setLevel] = useState(initialLevel);
  const { rows, cols, mines, type, topology } = level;
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

  const selectedLevel = predefinedLevels.find(v =>
    compareLevels(level, v)
  )?.name;

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setLevel({
        ...level,
        type: GridType[e.currentTarget.value as any] as unknown as GridType,
      }),
    [level]
  );

  const handleTopologyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setLevel({
        ...level,
        topology: Topology[e.currentTarget.value as any] as unknown as Topology,
      }),
    [level]
  );

  return (
    <div className="LevelChooser">
      <form
        onSubmit={e => {
          e.preventDefault();
          onChange(level);
          navigate('/');
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
              setLevel(getLevel(e.target.value, level.type, level.topology));
            }}
          >
            <option hidden={selectedLevel != null} value={custom}>
              {formatLevel({
                name: custom,
                cols,
                rows,
                mines,
                numeralSystem,
                asString: true,
              })}
            </option>
            {[...predefinedLevels.entries()].map(([k, v]) => (
              <option value={v.name} key={k}>
                {formatLevel({ ...v, numeralSystem, asString: true })}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset>
          <legend>Custom level</legend>
          <label>
            Rows: <FormatNumber numeralSystem={numeralSystem} n={rows} />
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
            Columns:
            <FormatNumber numeralSystem={numeralSystem} n={cols} />
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
            Mines:
            <FormatNumber numeralSystem={numeralSystem} n={mines} /> (
            <FormatNumber
              numeralSystem={numeralSystem}
              n={(100 * mines) / (rows * cols)}
              fractionDigits={1}
            />
            ﹪)
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
                    className="GridTypeRadio"
                    onChange={handleTypeChange}
                    checked={checked}
                    type="radio"
                    name="type"
                    value={name}
                  />
                  <div
                    className="SvgBoard"
                    data-s={GameState[GameState.GAME_OVER]}
                    style={{
                      width: '32px',
                      height: 'auto',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  >
                    {' '}
                    <SvgCell
                      cell={fromObject({
                        state,
                        threatCount: 2,
                        mine: undefined,
                      })}
                      content={content}
                      coordinate={0}
                      gridType={GridType[name as any] as unknown as GridType}
                    />
                  </div>
                </label>
              );
            })}
          <select onChange={handleTopologyChange} value={Topology[topology]}>
            {Object.keys(Topology)
              .filter(name => !isNaN(Number(name)))
              .map(k => {
                const t: Topology = k as unknown as Topology;
                const name = Topology[t];

                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
          </select>
        </fieldset>
        <button type="submit">OK</button>
        <button type="reset">Reset</button>
        <CloseButton text="Cancel" />
      </form>
    </div>
  );
};
