import * as React from 'react';
import SvgBoard from '../Svg/Board/SvgBoard';
import { NumThreats, legend } from '../../Game';
import { renderThreats } from '../Svg/Board/getContent';
import './SettingsDialog.scss';
import './NumeralSystemChooser.scss';
import ThemeChooser from './ThemeChooser';
import { NumeralSystem } from '../../lib';
import { useSettingsContext } from '../../store/contexts/settings';
import { navigate } from '../../router';
import CloseButton from '../CloseButton';

export type SettingsDialogProps = {};

const SettingsDialog: React.FC<SettingsDialogProps> = () => {
  const { state: initialState, setState } = useSettingsContext();
  const [theme, setTheme] = React.useState(initialState.theme);
  const [numeralSystem, setNumeralSystem] = React.useState(
    initialState.numeralSystem
  );

  const containerRef = React.useCallback(
    (e: HTMLDivElement) => {
      if (e != null) {
        e.classList.remove(...e.classList.values());
        e.classList.add('Page', ...theme.styles.map(t => t.Theme));
      }
    },
    [theme.styles]
  );

  const handleOnSubmit = (e: React.SyntheticEvent<any>) => {
    e.preventDefault();
    setState({ ...initialState, theme, numeralSystem });
    navigate('/');
  };
  const handleOnReset = (e: React.SyntheticEvent<any>) => {
    e.preventDefault();
    setTheme(initialState.theme);
    setNumeralSystem(initialState.numeralSystem);
  };
  return (
    <div ref={containerRef}>
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
              <SvgBoard
                board={legend().board}
                rotated={false}
                numeralSystem={numeralSystem}
              />
            </div>
          </section>
        </div>
        <div>
          <section>
            <main>
              <button type="submit">Apply changes</button>
              <button type="reset">Reset</button>
              <CloseButton text="Cancel" />
            </main>
          </section>
        </div>
      </form>
    </div>
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
          const value = NumeralSystem[name as any] as unknown as NumeralSystem;
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
