import React from 'react';
import './FormatNumber.scss';
import { NumeralSystem, formatNumber } from '../lib';
import { NumeralSystemContext } from '../store/contexts/settings';

export type Props = {
  n: number;
  numeralSystem: NumeralSystem;
  className?: string;
  fractionDigits?: undefined | 1 | 2;
};

const FormatNumber: React.FC<Props> = ({ n, className, fractionDigits }) => {
  const options = {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  const { numeralSystem } = React.useContext(NumeralSystemContext);
  return (
    <span
      className={className ?? 'FormatNumber'}
      data-numeralsystem={NumeralSystem[numeralSystem]}
      title={n.toString()}
      aria-label={n.toString()}
    >
      {formatNumber(numeralSystem, n, options)}
    </span>
  );
};

export default React.memo(FormatNumber);
