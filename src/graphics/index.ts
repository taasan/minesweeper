import { NumThreats, isNumThreats } from '../Game';

const componentMap = Object.freeze({
  '🤒': null, // Mine
  '😷': null, // Mine
  '🤮': null, // Mine
  '🤢': null, // Mine
  '🤡': null, // Mine
  '🧟': null, // Mine
  '🤥': null, // Mine
  '🤕': null, // Mine
  '🤧': null, // Mine
  '👻': null, // Mine
  '🥵': null, // Mine
  '🥶': null, // Mine
  '👹': null, // Mine
  '👺': null, // Mine
  '🦠': null, // Mine
  '🇳🇴': null, // National flag
  '☣️': null, // Flag
  '❓': null, // Flag uncertain
  '🥺': null, // Not flagged at game completed
  '💩': null, // Flagged incorrectly (at game over)
  '🥰': null, // Flagged and mined at game completed / game over
  '💀': null, // Exploded mine
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

export type SvgHref = {
  key: SvgSymbolKey;
  href: string;
};

export type SvgDataHref = {
  key: SvgSymbolKey;
  data: string;
};

export type SvgSymbol = SvgHref | SvgDataHref;

export type Content = SvgSymbol | NumThreats | string | SvgSymbolKey;

export function getContent(
  symbols: SvgSymbolMap,
  key: SvgSymbolKey
): Content | SvgSymbolKey {
  const sym = symbols[key];
  return sym ?? key;
}

export function isSvgDataHref(c?: SvgHref | SvgDataHref): c is SvgDataHref {
  c = c as SvgDataHref | undefined;
  return (
    typeof c?.data === 'string' &&
    c.data.startsWith('data:image/svg+xml;base64')
  );
}

export function isSvgHref(c?: SvgHref | SvgDataHref): c is SvgDataHref {
  c = c as SvgHref | undefined;
  return typeof c?.href === 'string';
}

export function isSvgSymbol(c: Content): c is SvgSymbol {
  if (c == null) {
    return false;
  }
  return (
    typeof c !== 'string' &&
    !isNumThreats(c) &&
    typeof c === 'object' &&
    (isSvgDataHref(c) || isSvgHref(c))
  );
}

export default componentMap;
