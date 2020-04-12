import React, { useState } from 'react';
import Themes, { ITheme } from '../../Theme';

const themes = Themes();

interface IProps {
  theme: ITheme;
  onChange: (value: ITheme) => void;
}

const ThemeChooser: React.FC<IProps> = ({ theme: initialTheme, onChange }) => {
  const [theme, setTheme] = useState<ITheme>(
    initialTheme != null ? initialTheme : themes[0]
  );
  console.log({ theme, setTheme });
  return (
    <div className="ThemeChooser">
      <select
        defaultValue={themes.indexOf(initialTheme)}
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
