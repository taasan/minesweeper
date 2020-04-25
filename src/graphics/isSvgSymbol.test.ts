import symbols, { SvgSymbolKey, isSvgSymbol } from './';

const keys = [...Object.getOwnPropertyNames(symbols)].filter(
  s => s !== '\u0000'
) as SvgSymbolKey[];

function testSvgSymbol(s: any, res: boolean) {
  test(`${JSON.stringify(s)} is ${res ? '' : 'not '}svg symbol`, () => {
    expect(isSvgSymbol(s)).toBe(res);
  });
}

// Not svg symbol
[
  ...keys,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  {
    key: '☣️',
    data: 'qweq',
  },
  {
    key: '☣️',
  },
  null,
  () => undefined,
].forEach(t => testSvgSymbol(t, false));

// Svg symbol
[
  {
    key: '☣️',
    data: 'data:image/svg+xml;base64, ',
  },
  {
    key: '☣️',
    href: './p.svg',
  },
].forEach(t => testSvgSymbol(t, true));
