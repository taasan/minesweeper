import { SvgHref, SvgSymbolKey } from '..';
import defs from './symbols.svg';

export default function getContent(key: SvgSymbolKey): SvgHref | SvgSymbolKey {
  return {
    key,
    href: `${defs}#${key}`,
    external: true,
  };
}
