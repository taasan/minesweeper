import theme from './theme.module.scss';

export enum Mode {
  DARK,
  LIGHT,
  AUTO,
}

export type ITheme = Readonly<{
  name: string;
  styles: Array<{ readonly [key: string]: string }>;
  mode?: Mode;
  symbols?: {
    flag: string;
  };
}>;

const simple: ITheme = {
  name: 'Simple',
  styles: [theme],
};

export default simple;
