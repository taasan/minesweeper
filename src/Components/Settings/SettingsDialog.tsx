import * as React from 'react';
import SvgBoard from '../Board/SvgBoard';
import { legend, NumThreats } from '../../Game';
import { NumeralSystem, renderThreats } from '../Board/getContent';
import { Action } from '../reducer';
import './SettingsDialog.scss';
import './NumeralSystemChooser.scss';
import ThemeChooser from './ThemeChooser';
import { ITheme } from '../../Theme';

export type ISettings = {
  numeralSystem: NumeralSystem;
  fitWindow: boolean;
  theme: ITheme;
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
  const [theme, setTheme] = React.useState<ITheme>(initialState.theme);
  return (
    <form className="SettingsDialog">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <fieldset>
          <legend>Numeral system</legend>
          <NumeralSystemChooser
            selected={numeralSystem}
            onChange={setNumeralSystem}
          />
        </fieldset>
        <fieldset>
          <legend>Theme</legend>
          <ThemeChooser theme={theme} onChange={setTheme} />
        </fieldset>
        <fieldset>
          <legend>Scaling</legend>
          <label>
            <input
              type="checkbox"
              defaultChecked={fitWindow}
              onChange={e => setFitWindow(e.currentTarget.checked)}
            />
            Fit to window
          </label>
        </fieldset>
        <section
          className={`SvgMinesweeper ${theme.styles
            .map(t => t.Theme)
            .join(' ')}`}
        >
          <header>
            <h1>Preview</h1>
          </header>
          <div
            style={{
              width: '200px',
              height: 'auto',
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
                    theme,
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
    </form>
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
    <ul className="NumeralSystemChooser">
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
                />{' '}
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
