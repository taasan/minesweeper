import theme from './theme.module.scss';
import solarized, * as Solarized from './Solarized';

export type ITheme = Readonly<{
  name: string;
  styles: Array<{ readonly [key: string]: string }>;
  darkMode?: boolean;
}>;

export const defaultTheme: ITheme = Object.freeze({
  name: 'Default',
  styles: [theme],
  darkMode: false,
});

export default () => {
  return [defaultTheme, solarized, Solarized.dark, Solarized.light];
};
