import { Content, SvgSymbolKey } from '..';

export const SYMBOLS: any = Object.freeze({
  '🤒': require('./emoji_u1f912.svg'),
  '😷': require('./emoji_u1f637.svg'),
  '🤮': require('./emoji_u1f92e.svg'),
  '🤢': require('./emoji_u1f922.svg'),
  '🤡': require('./emoji_u1f921.svg'),
  '🧟': require('./emoji_u1f9df.svg'),
  '🤥': require('./emoji_u1f925.svg'),
  '🤕': require('./emoji_u1f915.svg'),
  '🤧': require('./emoji_u1f927.svg'),
  '👻': require('./emoji_u1f47b.svg'),
  '🥵': require('./emoji_u1f975.svg'),
  '🥶': require('./emoji_u1f976.svg'),
  '👹': require('./emoji_u1f479.svg'),
  '👺': require('./emoji_u1f47a.svg'),
  '🦠': require('./emoji_u1f9a0.svg'),
  '🇳🇴': require('./emoji_u1f1f3.svg'),
  '☣️': require('./emoji_u2623.svg'),
  '❓': require('./emoji_u2753.svg'),
  '🥺': require('./emoji_u1f97a.svg'),
  '💩': require('./emoji_u1f4a9.svg'),
  '🥰': require('./emoji_u1f970.svg'),
  '💀': require('./emoji_u1f480.svg'),
});
/*
Object.keys(symbols).forEach(key => {
  symbols[key] = { key, href: symbols[key] };
});

export default Object.freeze(symbols) as SvgSymbolMap;
*/

export default function getContent(key: SvgSymbolKey): Content | SvgSymbolKey {
  const href = SYMBOLS[key];
  if (href == null) {
    return key;
  }
  return {
    key,
    href,
  };
}
