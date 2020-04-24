export { default as log } from './log';
export { default as toRomanNumeral } from './toRomanNumeral';
export { default as NumeralSystem } from './NumeralSystem';
export { default as getFitWindowCss } from './getFitWindowCss';
export { default as zero } from './zero';

export * from './NumeralSystem';
export * from './hex';

export type Keys<T, ValueType> = {
  [Key in keyof T]: T[Key] extends ValueType ? Key : never;
}[keyof T];

export type OmitByValueType<T, V> = Pick<T, Exclude<keyof T, Keys<T, V>>>;
export type PickByValueType<T, V> = Pick<T, Extract<keyof T, Keys<T, V>>>;
