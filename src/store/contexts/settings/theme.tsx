import React, { createContext, useState } from 'react';
import { defaultTheme } from '../../../Theme';
import { ITheme } from '../../../Theme/theme';

export type ThemeContext = {
  theme: ITheme;
  setTheme: (theme: ITheme) => void;
};

export const ThemeContext = createContext<ThemeContext>({
  theme: defaultTheme,
  setTheme: () => undefined,
});

export const ThemeContextProvider = (props: { children?: React.ReactNode }) => {
  const [theme, setTheme] = useState(defaultTheme);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
