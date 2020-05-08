import React from 'react';
import './FormatNumber.scss';
import { NumeralSystem, formatNumber, formatTime } from '../lib';
import { NumeralSystemContext } from '../store/contexts/settings';

type Props = {
  n: number;
  numeralSystem: NumeralSystem;
  className?: string;
  fractionDigits?: undefined | 1 | 2;
  asTime?: true;
};

const FormatNumber: React.FC<Props> = ({
  n,
  className,
  fractionDigits,
  asTime,
}) => {
  const options = {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  const { numeralSystem } = React.useContext(NumeralSystemContext);
  const format = asTime === true ? formatTime : formatNumber;
  return (
    <span
      className={className ?? 'FormatNumber'}
      data-numeralsystem={NumeralSystem[numeralSystem]}
      title={n.toString()}
      aria-label={n.toString()}
    >
      {format(numeralSystem, n, options)}
    </span>
  );
};

export default React.memo(FormatNumber);
