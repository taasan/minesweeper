import React, { createContext } from 'react';
import Themes, { defaultTheme } from '../../../Theme';
import { ITheme, isTheme } from '../../../Theme/theme';
import useLocalStorage from './useLocalStorage';
import _ from 'lodash';

export type IThemeContext = {
  theme: ITheme;
  setTheme: (theme: ITheme) => void;
};

export const ThemeContext = createContext<IThemeContext>({
  theme: defaultTheme,
  setTheme: _.noop,
});
const themes = new Map(Themes().map(t => [t.name, t]));

export const ThemeContextProvider = (props: { children?: React.ReactNode }) => {
  let [name, setTheme] = useLocalStorage('theme', defaultTheme.name);
  let theme = themes.get(name);
  if (!isTheme(theme)) {
    if (theme != null) console.warn('Invalid theme', { name, theme });
    theme = defaultTheme;
  }
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: (t: ITheme) => setTheme(t.name),
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
