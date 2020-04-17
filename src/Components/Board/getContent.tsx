import {
  CellState,
  GameState,
  Mine,
  NumThreats,
  isNumThreats,
  randomInt,
} from '../../Game';
import { toRomanNumeral } from '../../lib';

/*
# http://unicode.org/Public/UNIDATA/UnicodeData.txt
grep -E '(NUMERAL EIGHT|DIGIT EIGHT);' /usr/share/unicode/ucd/UnicodeData.txt \
  | awk -F\; '$9 == "8" {sub(/ (DIGIT )?EIGHT/,""); printf "%s = 0x%s - 8,\n", gensub(/[^A-Z0-9]/, "_", "g", $2), $1};' \
  | sed 's|^DIGIT|ASCII|'
  | xclip -selection clipboard
*/

/*
adlm	Adlam digits
ahom	Ahom digits
arab	Arabic-Indic digits
arabext	Extended Arabic-Indic digits
armn	Armenian upper case numerals — algorithmic
armnlow	Armenian lower case numerals — algorithmic
bali	Balinese digits
beng	Bengali digits
bhks	Bhaiksuki digits
brah	Brahmi digits
cakm	Chakma digits
cham	Cham digits
cyrl	Cyrillic numerals — algorithmic
deva	Devanagari digits
ethi	Ethiopic numerals — algorithmic
finance	Financial numerals — may be algorithmic
fullwide	Full width digits
geor	Georgian numerals — algorithmic
gong	Gunjala Gondi digits
gonm	Masaram Gondi digits
grek	Greek upper case numerals — algorithmic
greklow	Greek lower case numerals — algorithmic
gujr	Gujarati digits
guru	Gurmukhi digits
hanidays	Han-character day-of-month numbering for lunar/other traditional calendars
hanidec	Positional decimal system using Chinese number ideographs as digits
hans	Simplified Chinese numerals — algorithmic
hansfin	Simplified Chinese financial numerals — algorithmic
hant	Traditional Chinese numerals — algorithmic
hantfin	Traditional Chinese financial numerals — algorithmic
hebr	Hebrew numerals — algorithmic
hmng	Pahawh Hmong digits
hmnp	Nyiakeng Puachue Hmong digits
java	Javanese digits
jpan	Japanese numerals — algorithmic
jpanfin	Japanese financial numerals — algorithmic
jpanyear	Japanese first-year Gannen numbering for Japanese calendar
kali	Kayah Li digits
khmr	Khmer digits
knda	Kannada digits
lana	Tai Tham Hora (secular) digits
lanatham	Tai Tham Tham (ecclesiastical) digits
laoo	Lao digits
latn	Latin digits
lepc	Lepcha digits
limb	Limbu digits
mathbold	Mathematical bold digits
mathdbl	Mathematical double-struck digits
mathmono	Mathematical monospace digits
mathsanb	Mathematical sans-serif bold digits
mathsans	Mathematical sans-serif digits
mlym	Malayalam digits
modi	Modi digits
mong	Mongolian digits
mroo	Mro digits
mtei	Meetei Mayek digits
mymr	Myanmar digits
mymrshan	Myanmar Shan digits
mymrtlng	Myanmar Tai Laing digits
native	Native digits
newa	Newa digits
nkoo	N'Ko digits
olck	Ol Chiki digits
orya	Oriya digits
osma	Osmanya digits
rohg	Hanifi Rohingya digits
roman	Roman upper case numerals — algorithmic
romanlow	Roman lowercase numerals — algorithmic
saur	Saurashtra digits
shrd	Sharada digits
sind	Khudawadi digits
sinh	Sinhala Lith digits
sora	Sora_Sompeng digits
sund	Sundanese digits
takr	Takri digits
talu	New Tai Lue digits
taml	Tamil numerals — algorithmic
tamldec	Modern Tamil decimal digits
telu	Telugu digits
thai	Thai digits
tirh	Tirhuta digits
tibt	Tibetan digits
traditio	Traditional numerals — may be algorithmic
vaii	Vai digits
wara	Warang Citi digits
wcho	Wancho digits
*/

export enum NumeralSystem {
  ascii = 0x0038 - 8,
  ROMAN_NUMERAL = 0x2167 - 8,
  SMALL_ROMAN_NUMERAL = 0x2177 - 8,
  HANGZHOU_NUMERAL = 0x3028 - 8,
  MAYAN_NUMERAL = 0x1d2e8 - 8,
  COUNTING_ROD_UNIT = 0x1d367 - 8,
  ARABIC_INDIC = 0x0668 - 8,
  EXTENDED_ARABIC_INDIC = 0x06f8 - 8,
  NKO = 0x07c8 - 8,
  DEVANAGARI = 0x096e - 8,
  BENGALI = 0x09ee - 8,
  GURMUKHI = 0x0a6e - 8,
  GUJARATI = 0x0aee - 8,
  ORIYA = 0x0b6e - 8,
  TAMIL = 0x0bee - 8,
  TELUGU = 0x0c6e - 8,
  KANNADA = 0x0cee - 8,
  MALAYALAM = 0x0d6e - 8,
  SINHALA_LITH = 0x0dee - 8,
  THAI = 0x0e58 - 8,
  LAO = 0x0ed8 - 8,
  TIBETAN = 0x0f28 - 8,
  MYANMAR = 0x1048 - 8,
  MYANMAR_SHAN = 0x1098 - 8,
  ETHIOPIC = 0x1370 - 8,
  KHMER = 0x17e8 - 8,
  MONGOLIAN = 0x1818 - 8,
  LIMBU = 0x194e - 8,
  NEW_TAI_LUE = 0x19d8 - 8,
  TAI_THAM_HORA = 0x1a88 - 8,
  TAI_THAM_THAM = 0x1a98 - 8,
  BALINESE = 0x1b58 - 8,
  SUNDANESE = 0x1bb8 - 8,
  LEPCHA = 0x1c48 - 8,
  OL_CHIKI = 0x1c58 - 8,
  /*
  SUPERSCRIPT = 0x2078 - 8,
  SUBSCRIPT = 0x2088 - 8,
  CIRCLED = 0x2467 - 8,
  PARENTHESIZED = 0x247b - 8,
  DOUBLE_CIRCLED = 0x24fc - 8,
  DINGBAT_NEGATIVE_CIRCLED = 0x277d - 8,
  DINGBAT_CIRCLED_SANS_SERIF = 0x2787 - 8,
  DINGBAT_NEGATIVE_CIRCLED_SANS_SERIF = 0x2791 - 8,
  */
  VAI = 0xa628 - 8,
  SAURASHTRA = 0xa8d8 - 8,
  KAYAH_LI = 0xa908 - 8,
  JAVANESE = 0xa9d8 - 8,
  MYANMAR_TAI_LAING = 0xa9f8 - 8,
  CHAM = 0xaa58 - 8,
  MEETEI_MAYEK = 0xabf8 - 8,
  // FULLWIDTH = 0xff18 - 8,
  COPTIC_EPACT = 0x102e8 - 8,
  OSMANYA = 0x104a8 - 8,
  HANIFI_ROHINGYA = 0x10d38 - 8,
  RUMI = 0x10e67 - 8,
  BRAHMI = 0x1106e - 8,
  SORA_SOMPENG = 0x110f8 - 8,
  CHAKMA = 0x1113e - 8,
  SHARADA = 0x111d8 - 8,
  SINHALA_ARCHAIC = 0x111e8 - 8,
  KHUDAWADI = 0x112f8 - 8,
  NEWA = 0x11458 - 8,
  TIRHUTA = 0x114d8 - 8,
  MODI = 0x11658 - 8,
  TAKRI = 0x116c8 - 8,
  AHOM = 0x11738 - 8,
  WARANG_CITI = 0x118e8 - 8,
  DIVES_AKURU = 0x11958 - 8, // Unicode version 13.0
  BHAIKSUKI = 0x11c58 - 8,
  MASARAM_GONDI = 0x11d58 - 8,
  GUNJALA_GONDI = 0x11da8 - 8,
  MRO = 0x16a68 - 8,
  PAHAWH_HMONG = 0x16b58 - 8,
  MEDEFAIDRIN = 0x16e88 - 8,
  /*
  MATHEMATICAL_BOLD = 0x1d7d6 - 8,
  MATHEMATICAL_DOUBLE_STRUCK = 0x1d7e0 - 8,
  MATHEMATICAL_SANS_SERIF = 0x1d7ea - 8,
  MATHEMATICAL_SANS_SERIF_BOLD = 0x1d7f4 - 8,
  MATHEMATICAL_MONOSPACE = 0x1d7fe - 8,
  */
  NYIAKENG_PUACHUE_HMONG = 0x1e148 - 8,
  WANCHO = 0x1e2f8 - 8,
  MENDE_KIKAKUI = 0x1e8ce - 8,
  ADLAM = 0x1e958 - 8,
  SEGMENTED = 0x1fbf8 - 8,
}

// type NumeralSystemName = keyof typeof NumeralSystem;

export const NumeralSystemLocaleMap: {
  [key: string]: string;
} = Object.freeze({
  // ascii: undefined,
  ROMAN_NUMERAL: 'roman',
  SMALL_ROMAN_NUMERAL: 'romanlow',
  // HANGZHOU_NUMERAL: 0x3028 - 8,
  // MAYAN_NUMERAL: 0x1d2e8 - 8,
  // COUNTING_ROD_UNIT: 0x1d367 - 8,
  ARABIC_INDIC: 'arab',
  EXTENDED_ARABIC_INDIC: 'arabext',
  NKO: 'nkoo',
  DEVANAGARI: 'deva',
  BENGALI: 'beng',
  GURMUKHI: 'guru',
  GUJARATI: 'gujr',
  ORIYA: 'orya',
  // TODO taml eller tamldec?
  TAMIL: 'tamldec',
  TELUGU: 'telu',
  KANNADA: 'knda',
  MALAYALAM: 'mlym',
  SINHALA_LITH: 'sinh',
  THAI: 'thai',
  LAO: 'laoo',
  TIBETAN: 'tibt',
  MYANMAR: 'mymr',
  MYANMAR_SHAN: 'mymrshan',
  ETHIOPIC: 'ethi',
  KHMER: 'khmr',
  MONGOLIAN: 'mong',
  LIMBU: 'limb',
  NEW_TAI_LUE: 'talu',
  TAI_THAM_HORA: 'lana',
  TAI_THAM_THAM: 'lanatham',
  BALINESE: 'bail',
  SUNDANESE: 'sund',
  LEPCHA: 'lepc',
  OL_CHIKI: 'olck',
  /*
  SUPERSCRIPT : 0x2078 - 8,
  SUBSCRIPT : 0x2088 - 8,
  CIRCLED : 0x2467 - 8,
  PARENTHESIZED : 0x247b - 8,
  DOUBLE_CIRCLED : 0x24fc - 8,
  DINGBAT_NEGATIVE_CIRCLED : 0x277d - 8,
  DINGBAT_CIRCLED_SANS_SERIF : 0x2787 - 8,
  DINGBAT_NEGATIVE_CIRCLED_SANS_SERIF : 0x2791 - 8,
  */
  VAI: 'vaii',
  SAURASHTRA: 'saur',
  KAYAH_LI: 'kali',
  JAVANESE: 'java',
  MYANMAR_TAI_LAING: 'mymrtlng',
  CHAM: 'cham',
  MEETEI_MAYEK: 'mtei',
  // FULLWIDTH : 0xff18 - 8,
  // COPTIC_EPACT: 0x102e8 - 8,
  OSMANYA: 'osma',
  HANIFI_ROHINGYA: 'rohg',
  // RUMI: 0x10e67 - 8,
  BRAHMI: 'brah',
  SORA_SOMPENG: 'sora',
  CHAKMA: 'cakm',
  SHARADA: 'shrd',
  // SINHALA_ARCHAIC: 0x111e8 - 8,
  KHUDAWADI: 'sind',
  NEWA: 'newa',
  TIRHUTA: 'tirh',
  MODI: 'modi',
  TAKRI: 'takr',
  AHOM: 'ahom',
  WARANG_CITI: 'wara',
  // DIVES_AKURU: 0x11958 - 8, // Unicode version 13.0
  BHAIKSUKI: 'bhks',
  MASARAM_GONDI: 'gonm',
  GUNJALA_GONDI: 'gong',
  MRO: 'mroo',
  PAHAWH_HMONG: 'hmng',
  // MEDEFAIDRIN: 0x16e88 - 8,
  /*
  MATHEMATICAL_BOLD : 0x1d7d6 - 8,
  MATHEMATICAL_DOUBLE_STRUCK : 0x1d7e0 - 8,
  MATHEMATICAL_SANS_SERIF : 0x1d7ea - 8,
  MATHEMATICAL_SANS_SERIF_BOLD : 0x1d7f4 - 8,
  MATHEMATICAL_MONOSPACE : 0x1d7fe - 8,
  */
  NYIAKENG_PUACHUE_HMONG: 'hmnp',
  WANCHO: 'wcho',
  // MENDE_KIKAKUI: 0x1e8ce - 8,
  ADLAM: 'adlm',
  // SEGMENTED: 0x1fbf8 - 8,
});

export const formatNumber = (
  ns: NumeralSystem,
  n: number,
  options?: Intl.NumberFormatOptions
) => {
  if (
    (Number.isInteger(n) && ns === NumeralSystem.ROMAN_NUMERAL) ||
    ns === NumeralSystem.SMALL_ROMAN_NUMERAL
  ) {
    const r = toRomanNumeral(n, false);
    return r;
    // return ns === NumeralSystem.SMALL_ROMAN_NUMERAL ? r.toLowerCase() : r;
  }
  const numberingSystem = NumeralSystemLocaleMap[NumeralSystem[ns]];
  const locale =
    numberingSystem != null ? `en-u-nu-${numberingSystem}` : undefined;
  return n.toLocaleString(locale, options);
};

export const MINES = Object.freeze([
  '🤒',
  '😷',
  '🤮',
  '🤢',
  '🤡',
  '🧟',
  '🤥',
  '🤕',
  '🤧',
  '👻',
  '🥵',
  '🥶',
  '👹',
  '👺',
  '🦠',
]);

export const getFlag = () => {
  const today = new Date();
  const isMay17 = today.getDate() === 17 && today.getMonth() === 4;
  return isMay17 ? '🇳🇴' : '☣️';
};

export function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState,
  numeralSystem: NumeralSystem
): string | NumThreats {
  if (state === CellState.EXPLODED) {
    return '💀';
  }

  const disarmedMine = '🥰';
  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const demo = gameState === GameState.DEMO;
  const done = gameOver || gameWon || demo;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && isFlagged && (gameWon || gameOver);
  if (gameWon && isMined && state !== CellState.FLAGGED) {
    return '🥺';
  }
  if (isDisarmed) {
    return disarmedMine;
  }
  if ((gameOver || state === CellState.OPEN) && threats === 0xff) {
    return MINES[randomInt(MINES.length)];
  }
  if (gameState === GameState.COMPLETED) {
    return getContent(
      CellState.OPEN,
      threats,
      GameState.PLAYING,
      numeralSystem
    );
  }
  switch (state) {
    case CellState.FLAGGED:
      return (demo || gameOver) && !isMined ? '💩' : getFlag();
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return isNumThreats(threats)
        ? renderThreats(numeralSystem, threats)
        : '\u00A0';
    default:
      return '\u00A0';
  }
}

export function renderThreats(numeralSystem: NumeralSystem, n: NumThreats) {
  return String.fromCodePoint(numeralSystem + n);
  // return formatNumber(numeralSystem, n); // String.fromCodePoint(numeralSystem + n);
}
