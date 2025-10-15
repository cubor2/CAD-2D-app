export function handleTextResize(element, handle, dx, dy, ctx, viewport, calculateTextResize) {
  const { x: newX, y: newY, fontSize: newFontSize } = calculateTextResize(element, handle, dx, dy, ctx);

  return {
    ...element,
    x: newX,
    y: newY,
    fontSize: newFontSize
  };
}

export function handleTextControlPoints(element, ctx, getTextControlPoints) {
  return getTextControlPoints(element, ctx);
}

export function handleTextClick(point, click, viewport, isPointClickable) {
  return isPointClickable(point, click);
}


