const data: Array<[number, string, string]> = [
  [1000, 'Ⅿ', 'M'],
  [900, 'ⅭⅯ', 'CM'],
  [500, 'Ⅾ', 'D'],
  [400, 'ⅭⅮ', 'CD'],
  [100, 'Ⅽ', 'C'],
  [90, 'ⅩⅭ', 'XC'],
  [50, 'Ⅼ', 'L'],
  [40, 'ⅩⅬ', 'XL'],
  [12, 'Ⅻ', 'XII'],
  [11, 'Ⅺ', 'XI'],
  [10, 'Ⅹ', 'X'],
  [9, 'Ⅸ', 'IX'],
  [8, 'Ⅷ', 'VIII'],
  [7, 'Ⅶ', 'VII'],
  [6, 'Ⅵ', 'VI'],
  [5, 'Ⅴ', 'V'],
  [4, 'Ⅳ', 'IV'],
  [3, 'Ⅲ', 'III'],
  [2, 'Ⅱ', 'II'],
  [1, 'Ⅰ', 'I'],
];

const toRomanNumeral = (number: number, returnUnicode: boolean): string => {
  if (number === 0 || number > 4000) {
    return number.toString();
  }
  let result = [number < 0 ? '−' : ''];
  number = Math.abs(number);

  data.forEach(([digit, unicode, ascii]) => {
    while (number >= digit && number > 0) {
      if ((digit === 12 && number > 12) || (digit === 11 && number > 11)) {
        break;
      }

      result.push(returnUnicode ? unicode : ascii);
      number -= digit;
    }
  });
  return result.join('');
};

export default toRomanNumeral;
