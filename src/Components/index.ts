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
  { x: 0, y: 1 },
  { x: 0.5, y: hexOffset + 1 },
  { x: 1.5, y: hexOffset + 1 },
  { x: 2, y: 1 },
  { x: 1.5, y: -hexOffset + 1 },
  { x: 0.5, y: -hexOffset + 1 },
];
