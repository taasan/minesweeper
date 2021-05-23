import simple from './theme';

import solarized, * as Solarized from './Solarized';

export const defaultTheme = solarized;

const themes = () => {
  return [simple, solarized, Solarized.dark, Solarized.light];
};

export default themes;
