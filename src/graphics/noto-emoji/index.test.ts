import symbols, { SvgSymbolKey, isSvgDataHref } from '..';
import getSymbol, { SYMBOLS } from '.';

const keys = [...Object.getOwnPropertyNames(symbols)].filter(
  s => s !== '\u0000'
) as SvgSymbolKey[];

keys.forEach(s => {
  test(`has symbol ${s}`, () => {
    const res = getSymbol(s);
    expect(isSvgDataHref(res)).toBe(true);
  });
});

const notoKeys = [...Object.getOwnPropertyNames(SYMBOLS)].filter(
  s => s !== '\u0000'
) as SvgSymbolKey[];

notoKeys.forEach(s => {
  test(`${s} is valid symbol`, () => {
    expect(keys.includes(s)).toBe(true);
  });
});
