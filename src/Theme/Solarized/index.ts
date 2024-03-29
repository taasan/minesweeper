import solarized from './solarized.module.scss';
import _dark from './dark.module.scss';
import _light from './light.module.scss';
import _auto from './auto.module.scss';
import { ITheme, Mode, createTheme } from '../theme';

export const dark: ITheme = createTheme({
  name: 'Solarized dark',
  styles: [solarized, _dark],
  mode: Mode.DARK,
});

export const light: ITheme = createTheme({
  name: 'Solarized light',
  styles: [solarized, _light],
  mode: Mode.LIGHT,
});

export const auto: ITheme = createTheme({
  name: 'Solarized (auto)',
  styles: [solarized, _auto],
  mode: Mode.AUTO,
});

export default auto;
