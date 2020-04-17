import * as React from 'react';
import SvgBoard from '../Board/SvgBoard';
import { NumThreats, legend } from '../../Game';
import { NumeralSystem, renderThreats } from '../Board/getContent';
import './SettingsDialog.scss';
import './NumeralSystemChooser.scss';
import ThemeChooser from './ThemeChooser';
import { ITheme } from '../../Theme/theme';
import { ModalAction, SettingsAction } from '../reducer';
import CloseButton from '../CloseButton';

export type ISettings = {
  numeralSystem: NumeralSystem;
  fitWindow: boolean;
  theme: ITheme;
};

export type SettingsDialogProps = {
  dispatch: React.Dispatch<SettingsAction | ModalAction>;
  initialState: ISettings;
};

export type Action =
  | {
      type: 'setNumeralSystem';
      payload: Pick<ISettings, 'numeralSystem'>;
    }
  | {
      type: 'setTheme';
      payload: Pick<ISettings, 'theme'>;
    }
  | {
      type: 'setFitWindow';
      payload: Pick<ISettings, 'fitWindow'>;
    }
  | {
      type: 'apply';
      payload: Partial<ISettings>;
    };

const reducer = (state: ISettings, action: Action): ISettings => {
  switch (action.type) {
    case 'apply':
      return { ...state, ...action.payload };
    case 'setFitWindow':
      return { ...state, ...action.payload };
    case 'setNumeralSystem':
      return { ...state, ...action.payload };
    case 'setTheme':
      return { ...state, ...action.payload };
  }
  console.log(action);
  return state;
};

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  initialState,
  dispatch: parentDispatch,
}) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { theme, numeralSystem, fitWindow } = state;
  // const [theme, setTheme] = React.useState<ITheme>(initialState.theme);
  // const [numeralSystem, setNumeralSystem] = React.useState<NumeralSystem>(
  //  initialState.numeralSystem
  // );
  // const [fitWindow, setFitWindow] = React.useState(initialState.fitWindow);

  const handleOnThemeChange = React.useCallback(
    // eslint-disable-next-line no-shadow
    theme => dispatch({ type: 'setTheme', payload: { theme } }),
    []
  );

  const handleOnFitWindowChange = React.useCallback(
    e =>
      dispatch({
        type: 'setFitWindow',
        payload: { fitWindow: e.currentTarget.checked },
      }),
    []
  );

  const handleNumeralSystemChange = React.useCallback(
    // eslint-disable-next-line no-shadow
    numeralSystem =>
      dispatch({ type: 'setNumeralSystem', payload: { numeralSystem } }),
    []
  );

  const closeModal = React.useCallback(
    () => parentDispatch({ type: 'closeModal' }),
    [parentDispatch]
  );
  return (
    <form
      className="SettingsDialog"
      onSubmit={e => {
        e.preventDefault();
        parentDispatch({
          type: 'applySettings',
          settings: {
            ...state,
          },
        });
      }}
      onReset={e => {
        e.preventDefault();
        dispatch({ type: 'apply', payload: initialState });
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
            <CloseButton close={closeModal} text="Cancel" />
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
  ({ selected, onChange }) => (
    <ul className="NumeralSystemChooser">
      {Object.keys(NumeralSystem)
        .filter(name => isNaN(Number(name)))
        .map(name => {
          const value = (NumeralSystem[
            name as any
          ] as unknown) as NumeralSystem;
          return (
            <li key={value}>
              <label title={name}>
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
                {[...new Array(8)].map((_v, n) => (
                  <span
                    className="NumeralSystemChooser__digit"
                    key={n}
                    style={{
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
  )
);

export default SettingsDialog;
