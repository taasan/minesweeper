import React from 'react';
import Themes from '../../Theme';
import { ITheme } from '../../Theme/theme';

const themes = Themes();

interface IProps {
  theme: ITheme;
  onChange: (value: ITheme) => void;
}

const ThemeChooser: React.FC<IProps> = ({ theme, onChange }) => {
  return (
    <div className="ThemeChooser">
      <select
        value={themes.indexOf(theme)}
        onChange={e => onChange(themes[parseInt(e.currentTarget.value)])}
      >
        {themes.map((t, i) => (
          <option key={t.name} value={i}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(ThemeChooser);
