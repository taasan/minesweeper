import symbols, { NATIONAL_FLAG, SvgSymbolKey, isSvgHref } from '..';
import getSymbol from '.';
import { readFileSync } from 'fs';

const keys = [...Object.getOwnPropertyNames(symbols)].filter(
  s => s !== '\0' && s !== NATIONAL_FLAG
) as SvgSymbolKey[];

const svg = './symbols.svg';

const parser = new DOMParser();
const xmlString = readFileSync(`${__dirname}/${svg}`, {
  encoding: 'utf8',
});
const doc = parser.parseFromString(xmlString, 'image/svg+xml');

const notoKeys = [...doc.querySelectorAll('symbol')].map(
  e => e.id
) as SvgSymbolKey[];

notoKeys.forEach(s => {
  test(`${s} is valid symbol`, () => {
    expect(keys.includes(s)).toBe(true);
  });
});

keys.forEach(s => {
  test(`getSymbol ${s} is svg href`, () => {
    const res = getSymbol(s);
    expect(isSvgHref(res)).toBe(true);
  });
  test(`has symbol ${s}`, () => {
    expect(notoKeys.includes(s)).toBe(true);
  });
});
