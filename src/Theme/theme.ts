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

export const isTheme = (c: any): c is ITheme =>
  c != null &&
  typeof c.name === 'string' &&
  (c.mode == null || Mode[c.mode] != null) &&
  Array.isArray(c.styles) &&
  (c.styles as Array<any>).find(v => typeof v !== 'string') != null &&
  (c.symbols == null || typeof c.symbols.flag === 'string');

export const createTheme = (partial: PartialTheme): ITheme => {
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
