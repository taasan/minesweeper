import { NumThreats, isNumThreats } from '../Game';

const componentMap = Object.freeze({
  '🤒': null,
  '😷': null,
  '🤮': null,
  '🤢': null,
  '🤡': null,
  '🧟': null,
  '🤥': null,
  '🤕': null,
  '🤧': null,
  '👻': null,
  '🥵': null,
  '🥶': null,
  '👹': null,
  '👺': null,
  '🦠': null,
  '🇳🇴': null,
  '☣️': null,
  '❓': null,
  '🥺': null,
  '💩': null,
  '🥰': null,
  '💀': null,
});

export type SvgComponent = React.FunctionComponent<
  React.SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  }
>;

export type SvgSymbolKey = keyof typeof componentMap;

export type SvgSymbolMap = {
  [key in SvgSymbolKey]: SvgSymbol | null;
};

export type SvgSymbol = {
  key: SvgSymbolKey;
  href: string;
};

export type Content = SvgSymbol | NumThreats | string | SvgSymbolKey;

export function getContent(
  symbols: SvgSymbolMap,
  key: SvgSymbolKey
): Content | SvgSymbolKey {
  const sym = symbols[key];
  return sym ?? key;
}

export function isSvgSymbol(c?: Content): c is SvgSymbol {
  return (
    c != null &&
    typeof c !== 'string' &&
    !isNumThreats(c) &&
    typeof c === 'object' &&
    (c == null || typeof c.href === 'string')
  );
}

export default componentMap;
