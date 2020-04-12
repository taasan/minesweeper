import theme from './theme.module.scss';
import solarized, * as Solarized from './Solarized';

export type ITheme = Readonly<{
  name: string;
  styles: Array<{ readonly [key: string]: string }>;
  darkMode?: boolean;
}>;

const simple: ITheme = Object.freeze({
  name: 'Simple',
  styles: [theme],
  darkMode: false,
});

export const defaultTheme = solarized;

export default () => {
  return [simple, solarized, Solarized.dark, Solarized.light];
};
