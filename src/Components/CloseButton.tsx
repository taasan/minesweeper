import React, { AriaAttributes } from 'react';

type Props = {
  text: string;
  tooltip?: string;
  close(): void;
  aria?: AriaAttributes;
};

const CloseButton: React.FC<Props> = ({ close, text, tooltip, aria }) => (
  <button
    {...aria}
    title={tooltip}
    className="CloseButton"
    type="button"
    onClick={close}
  >
    {text}
  </button>
);

export default React.memo(CloseButton);
