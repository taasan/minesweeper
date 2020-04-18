import * as React from 'react';
import SvgBoard from '../Board/SvgBoard';
import { NumThreats, legend } from '../../Game';
import { renderThreats } from '../Board/getContent';
import './SettingsDialog.scss';
import './NumeralSystemChooser.scss';
import ThemeChooser from './ThemeChooser';
import { ISettings, ModalAction } from '../../store';
import CloseButton from '../CloseButton';
import { NumeralSystem } from '../../lib';
import {
  NumeralSystemContext,
  useSettingsContext,
} from '../../store/contexts/settings';
import { useDomTokenList } from '../../Hooks';

export type SettingsDialogProps = {
  dispatch: React.Dispatch<ModalAction>;
  containerDiv?: HTMLDivElement;
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

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  dispatch,
  containerDiv,
}) => {
  const { state: initialState, setState } = useSettingsContext();
  const [theme, setTheme] = React.useState(initialState.theme);
  const [numeralSystem, setNumeralSystem] = React.useState(
    initialState.numeralSystem
  );
  useDomTokenList(
    containerDiv,
    theme.styles.map(t => t.Theme)
  );
  React.useEffect(() => {
    const classes = theme.styles.map(t => t.Theme);
    const classList = containerDiv?.classList;
    classList?.add(...classes);
    return () => classList?.remove(...classes);
  });

  const closeModal = React.useCallback(() => dispatch({ type: 'closeModal' }), [
    dispatch,
  ]);

  const handleOnSubmit = (e: React.SyntheticEvent<any>) => {
    e.preventDefault();
    setState({ ...initialState, theme, numeralSystem });
    closeModal();
  };
  const handleOnReset = (e: React.SyntheticEvent<any>) => {
    e.preventDefault();
    setTheme(initialState.theme);
    setNumeralSystem(initialState.numeralSystem);
  };
  return (
    <form
      className="SettingsDialog"
      onSubmit={handleOnSubmit}
      onReset={handleOnReset}
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
            onChange={setNumeralSystem}
          />
        </fieldset>
        <fieldset>
          <legend>Theme</legend>
          <ThemeChooser theme={theme} onChange={setTheme} />
        </fieldset>
        <section className="SvgMinesweeper">
          <div
            style={{
              width: '200px',
              height: 'auto',
            }}
          >
            <NumeralSystemContext.Provider
              value={{ numeralSystem, setNumeralSystem: () => void 0 }}
            >
              <SvgBoard board={legend().board} />
            </NumeralSystemContext.Provider>
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
