import simple from './theme';

import solarized, * as Solarized from './Solarized';

export const defaultTheme = solarized;

export default () => {
  return [simple, solarized, Solarized.dark, Solarized.light];
};
