import solarized from './solarized.module.scss';
import _dark from './dark.module.scss';
import _light from './light.module.scss';
import _auto from './auto.module.scss';
import { ITheme } from '..';

export const dark: ITheme = Object.freeze({
  name: 'Solarized dark',
  styles: [solarized, _dark],
  darkMode: true,
});

export const light: ITheme = Object.freeze({
  name: 'Solarized light',
  styles: [solarized, _light],
  darkMode: false,
});

export const auto: ITheme = Object.freeze({
  name: 'Solarized (auto)',
  styles: [solarized, _auto],
});

export default auto;
