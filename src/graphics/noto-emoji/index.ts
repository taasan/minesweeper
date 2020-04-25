import { Content, SvgSymbolKey } from '..';

import emoji_u1f1f3 from './emoji_u1f1f3';
import emoji_u1f479 from './emoji_u1f479';
import emoji_u1f47a from './emoji_u1f47a';
import emoji_u1f47b from './emoji_u1f47b';
import emoji_u1f480 from './emoji_u1f480';
import emoji_u1f4a9 from './emoji_u1f4a9';
import emoji_u1f637 from './emoji_u1f637';
import emoji_u1f912 from './emoji_u1f912';
import emoji_u1f915 from './emoji_u1f915';
import emoji_u1f921 from './emoji_u1f921';
import emoji_u1f922 from './emoji_u1f922';
import emoji_u1f925 from './emoji_u1f925';
import emoji_u1f927 from './emoji_u1f927';
import emoji_u1f92e from './emoji_u1f92e';
import emoji_u1f970 from './emoji_u1f970';
import emoji_u1f975 from './emoji_u1f975';
import emoji_u1f976 from './emoji_u1f976';
import emoji_u1f97a from './emoji_u1f97a';
import emoji_u1f9a0 from './emoji_u1f9a0';
import emoji_u1f9df from './emoji_u1f9df';
import emoji_u2623 from './emoji_u2623';
import emoji_u2753 from './emoji_u2753';

export const SYMBOLS: any = Object.freeze({
  '🤒': emoji_u1f912,
  '😷': emoji_u1f637,
  '🤮': emoji_u1f92e,
  '🤢': emoji_u1f922,
  '🤡': emoji_u1f921,
  '🧟': emoji_u1f9df,
  '🤥': emoji_u1f925,
  '🤕': emoji_u1f915,
  '🤧': emoji_u1f927,
  '👻': emoji_u1f47b,
  '🥵': emoji_u1f975,
  '🥶': emoji_u1f976,
  '👹': emoji_u1f479,
  '👺': emoji_u1f47a,
  '🦠': emoji_u1f9a0,
  '🇳🇴': emoji_u1f1f3,
  '☣️': emoji_u2623,
  '❓': emoji_u2753,
  '🥺': emoji_u1f97a,
  '💩': emoji_u1f4a9,
  '🥰': emoji_u1f970,
  '💀': emoji_u1f480,
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
