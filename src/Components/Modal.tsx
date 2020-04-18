import React from 'react';
import ReactModal from 'react-modal';
import './Modal.scss';

const Modal: React.FC<ReactModal.Props> = props => {
  const className = props.className != null ? props.className : '';
  const mProps = {
    ...props,
    className: `Modal ${className}`.trimEnd(),
    overlayClassName: 'ModalOverlay',
  };
  return <ReactModal {...mProps} style={undefined} />;
};

export default Modal;
