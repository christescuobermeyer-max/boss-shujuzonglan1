type SidePanelHeightInput = {
  leftHeight: number;
  leftBottom: number;
  rightHeight: number;
  rightBottom: number;
};

type SidePanelHeightResult = {
  leftPanelMinHeight: number | null;
  rightPanelMinHeight: number | null;
};

export function getSidePanelMinHeights({
  leftHeight,
  leftBottom,
  rightHeight,
  rightBottom
}: SidePanelHeightInput): SidePanelHeightResult {
  if (leftBottom < rightBottom) {
    return {
      leftPanelMinHeight: Math.ceil(leftHeight + (rightBottom - leftBottom)),
      rightPanelMinHeight: null
    };
  }

  if (rightBottom < leftBottom) {
    return {
      leftPanelMinHeight: null,
      rightPanelMinHeight: Math.ceil(rightHeight + (leftBottom - rightBottom))
    };
  }

  return {
    leftPanelMinHeight: null,
    rightPanelMinHeight: null
  };
}
