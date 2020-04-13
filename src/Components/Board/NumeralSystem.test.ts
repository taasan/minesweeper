import { NumeralSystem } from './getContent';
// @ts-ignore
import Nd from 'unicode/category/Nd';
// @ts-ignore
import No from 'unicode/category/No';

// @ts-ignore
import Mn from 'unicode/category/Mn';

// @ts-ignore
import Cf from 'unicode/category/Cf';
// @ts-ignore
import Nl from 'unicode/category/Nl';

const Numbers = { ...Nd, ...No, ...Mn, ...Cf, ...Nl };

Object.keys(NumeralSystem)
  .filter(name => isNaN(Number(name)))
  .map(name => {
    const ns = (NumeralSystem[name as any] as unknown) as NumeralSystem;
    return {
      name,
      digits: [...new Array(8)].map((_, i) => ({
        _n: i + 1,
        ...Numbers[ns + i + 1],
      })),
    };
  })
  .forEach(res => {
    test(`NumeralSystem[${res.name}] is valid`, () => {
      // if (res.name === 'DIVES AKURU') console.log(res);
      res.digits.forEach(v => expect(v.numeric_value).toBe(v._n.toString()));
    });
  });
