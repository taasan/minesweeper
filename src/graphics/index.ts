import { NumThreats, isNumThreats } from '../Game';
import _ from 'lodash';

export const FLAG = '☣️';
export const UNCERTAIN_FLAG = '❓';
export const UNFLAGGED_MINE = '🥺';
export const MISPLACED_FLAG = '💩';
export const NATIONAL_FLAG = '🇳🇴';

export const DISARMED_MINE = '🥰';
export const EXPLODED_MINE = '💀';

export const getFlag = () => {
  const today = new Date();
  const isMay17 = today.getDate() === 17 && today.getMonth() === 4;
  return isMay17 ? NATIONAL_FLAG : FLAG;
};

const componentMap = {
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
  '\u0000': null, // Separator
  [NATIONAL_FLAG]: null, // National flag
  [FLAG]: null, // Flag
  [UNCERTAIN_FLAG]: null, // Flag uncertain
  [UNFLAGGED_MINE]: null, // Not flagged at game completed
  [MISPLACED_FLAG]: null, // Flagged incorrectly (at game over)
  [DISARMED_MINE]: null, // Flagged and mined at game completed / game over
  [EXPLODED_MINE]: null, // Exploded mine
};

export const MINES = Object.freeze(
  _.takeWhile(Object.keys(componentMap), e => e !== '\u0000')
);

export type SvgComponent = React.FunctionComponent<
  React.SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  }
>;

export type SvgSymbolKey = keyof Exclude<typeof componentMap, '\u0000'>;

export type SvgSymbolMap = {
  [key in SvgSymbolKey]: SvgSymbol | null;
};

export type SvgHref = {
  key: SvgSymbolKey;
  href: string;
  external: boolean;
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

export function isSvgDataHref(
  c: SvgHref | SvgDataHref | string
): c is SvgDataHref {
  if (c == null || typeof c !== 'object') {
    return false;
  }
  c = c as SvgDataHref;
  return (
    typeof c.data === 'string' &&
    c.data.startsWith('data:image/svg+xml;base64,')
  );
}

export function isSvgHref(c?: SvgHref | SvgDataHref | string): c is SvgHref {
  if (typeof c !== 'object') {
    return false;
  }
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
    (isSvgDataHref(c) || isSvgHref(c))
  );
}

export default componentMap;
