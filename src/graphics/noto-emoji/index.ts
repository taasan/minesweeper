import { NATIONAL_FLAG, SvgHref, SvgSymbolKey } from '..';
import defs from './symbols.svg';

export default function getContent(key: SvgSymbolKey): SvgHref | SvgSymbolKey {
  if (key === NATIONAL_FLAG) {
    return key;
  }
  return {
    key,
    href: `${defs}#${key}`,
    external: true,
  };
}
