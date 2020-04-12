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
  const [state, setState] = React.useState<ISettings>(initialState);
  const { theme, fitWindow, numeralSystem } = state;

  const handleOnThemeChange = React.useCallback(
    // eslint-disable-next-line no-shadow
    theme => setState({ ...state, theme }),
    [state]
  );
  const handleOnFitWindowChange = React.useCallback(
    e => setState({ ...state, fitWindow: e.currentTarget.checked }),
    [state]
  );

  const handleNumeralSystemChange = React.useCallback(
    // eslint-disable-next-line no-shadow
    numeralSystem => setState({ ...state, numeralSystem }),
    [state]
  );

  return (
    <form
      className="SettingsDialog"
      onSubmit={e => {
        e.preventDefault();
        dispatch({
          type: 'applySettings',
          settings: {
            numeralSystem,
            fitWindow,
            theme,
          },
        });
      }}
      onReset={e => {
        e.preventDefault();
        setState(initialState);
      }}
    >
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
            onChange={handleNumeralSystemChange}
          />
        </fieldset>
        <fieldset>
          <legend>Theme</legend>
          <ThemeChooser theme={theme} onChange={handleOnThemeChange} />
        </fieldset>
        <fieldset>
          <legend>Scaling</legend>
          <label>
            <input
              type="checkbox"
              checked={fitWindow}
              onChange={handleOnFitWindowChange}
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
            <button type="submit">Apply changes</button>
            <button type="reset">Reset</button>
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

const NumeralSystemChooser: React.FC<NumeralSystemChooserProps> = React.memo(
  ({ selected, onChange }) => {
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
                    name="numeralsystem"
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
  }
);

export default SettingsDialog;
