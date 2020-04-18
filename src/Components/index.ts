export const onContextMenu = (e: {
  preventDefault(): void;
  stopPropagation(): void;
}) => {
  e.stopPropagation();
  e.preventDefault();
  return false;
};
