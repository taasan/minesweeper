import React, { AriaAttributes } from 'react';

type Props = {
  text: string;
  tooltip?: string;
  close(): void;
  aria?: AriaAttributes;
};

export const CloseButton: React.FC<Props> = ({
  close,
  text,
  tooltip,
  aria,
}) => {
  return (
    <button
      title={tooltip}
      className="CloseButton"
      type="button"
      onClick={close}
      {...aria}
    >
      {text}
    </button>
  );
};
