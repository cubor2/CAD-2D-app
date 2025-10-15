export const screenToWorld = (screenX, screenY, canvas, viewport) => {
  const rect = canvas.getBoundingClientRect();
  const x = (screenX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
  const y = (screenY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
  return { x, y };
};

export const worldToScreen = (worldX, worldY, canvas, viewport) => {
  const rect = canvas.getBoundingClientRect();
  const x = worldX * viewport.zoom + rect.width / 2 + viewport.x;
  const y = worldY * viewport.zoom + rect.height / 2 + viewport.y;
  return { x, y };
};


