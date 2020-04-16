import React from 'react';
import { NumeralSystem, formatNumber } from './Board/getContent';
import './FormatNumber.scss';

export type Props = {
  n: number;
  numeralSystem: NumeralSystem;
  className?: string;
  fractionDigits?: undefined | 1 | 2;
};

const FormatNumber: React.FC<Props> = ({
  n,
  numeralSystem,
  className,
  fractionDigits,
}) => {
  const options = {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
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
