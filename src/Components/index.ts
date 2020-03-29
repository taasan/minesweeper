export const onContextMenu = (e: {
  preventDefault(): void;
  stopPropagation(): void;
}) => {
  e.stopPropagation();
  e.preventDefault();
  return false;
};

export const hexOffset = Math.sqrt(3) / 2;

export const hexagonPoints = () => [
  { y: 0, x: 1 },
  { y: 0.5, x: hexOffset + 1 },
  { y: 1.5, x: hexOffset + 1 },
  { y: 2, x: 1 },
  { y: 1.5, x: -hexOffset + 1 },
  { y: 0.5, x: -hexOffset + 1 },
];
