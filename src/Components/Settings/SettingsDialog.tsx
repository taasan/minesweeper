import * as React from 'react';
import StyleSelector from '../StyleSelector';
import SvgBoard from '../Board/SvgBoard';
import { legend, NumThreats } from '../../Game';
import { NumeralSystem, renderThreats } from '../Board/getContent';
import { Action } from '../reducer';

export type ISettings = {
  numeralSystem: NumeralSystem;
  fitWindow: boolean;
};

export type SettingsDialogProps = {
  dispatch: React.Dispatch<Action>;
  initialState: ISettings;
};

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  initialState,
  dispatch,
}) => {
  const [numeralSystem, setNumeralSystem] = React.useState(
    initialState.numeralSystem
  );
  const [fitWindow, setFitWindow] = React.useState(initialState.fitWindow);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <section>
          <header>
            <h1>Numeral system</h1>
          </header>
          <main>
            <NumeralSystemChooser
              selected={numeralSystem}
              onChange={setNumeralSystem}
            />
          </main>
        </section>
        <section>
          <header>
            <h2>Style</h2>
          </header>
          <main>
            <StyleSelector />
          </main>
        </section>
        <section>
          <header>
            <h2>Scaling</h2>
          </header>
          <main>
            <label>
              <input
                type="checkbox"
                defaultChecked={fitWindow}
                onChange={e => setFitWindow(e.currentTarget.checked)}
              />
              Fit to window
            </label>
          </main>
        </section>
        <section>
          <header>
            <h1>Preview</h1>
          </header>
          <div
            style={{
              width: '200px',
              height: '200px',
            }}
          >
            <SvgBoard board={legend().board} numeralSystem={numeralSystem} />
          </div>
        </section>
      </div>
      <div>
        <section>
          <main>
            <button
              onClick={() => {
                dispatch({
                  type: 'applySettings',
                  settings: {
                    numeralSystem,
                    fitWindow,
                  },
                });
              }}
            >
              Apply changes
            </button>
            <button
              onClick={() => {
                dispatch({
                  type: 'applySettings',
                  settings: initialState,
                });
              }}
            >
              Revert changes
            </button>
          </main>
        </section>
      </div>
    </div>
  );
};

interface NumeralSystemChooserProps {
  selected: NumeralSystem;
  onChange: (value: NumeralSystem) => void;
}

const NumeralSystemChooser: React.FC<NumeralSystemChooserProps> = ({
  selected,
  onChange,
}) => {
  return (
    <ul
      className="NumeralSystemChooser"
      style={{ listStyleType: 'none', padding: 0 }}
    >
      {Object.keys(NumeralSystem)
        .filter(name => isNaN(Number(name)))
        .map(name => {
          const value = (NumeralSystem[
            name as any
          ] as unknown) as NumeralSystem;
          return (
            <li key={value}>
              <label>
                <input
                  checked={selected === value}
                  type="radio"
                  value={value}
                  onChange={e => {
                    if (e.currentTarget.checked) {
                      onChange(value);
                    }
                  }}
                />
                {name}
                {': '}
                {[...new Array(8)].map((_, n) => (
                  <span
                    key={n}
                    style={{
                      display: 'inline list-item',
                      color: `var(--cell-threats-${n + 1}-color)`,
                    }}
                  >
                    {renderThreats(value, (n + 1) as NumThreats)}
                  </span>
                ))}
              </label>
            </li>
          );
        })}
    </ul>
  );
};

export default SettingsDialog;