import theme from './theme.module.scss';

export enum Mode {
  DARK,
  LIGHT,
  AUTO,
}

export type PartialTheme = {
  name: string;
  styles: Array<{ readonly [key: string]: string }>;
  mode?: Mode;
  symbols?: {
    flag: string;
  };
};

export type ITheme = Readonly<
  PartialTheme & {
    classNames: ReadonlyArray<string>;
  }
>;

export const createTheme = (partial: PartialTheme): ITheme => {
  console.log('createTheme', { partial });
  return Object.freeze({
    ...partial,
    classNames: Object.freeze(partial.styles.map(t => t.Theme)),
  });
};

const simple: ITheme = createTheme({
  name: 'Simple',
  styles: [theme],
});

export default simple;
