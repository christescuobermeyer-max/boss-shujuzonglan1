"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getSidePanelMinHeights } from "@/lib/stats/side-panel-height";

export function useSidePanelMinHeight(deps: readonly unknown[]) {
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const [leftPanelMinHeight, setLeftPanelMinHeight] = useState<number | null>(null);
  const [rightPanelMinHeight, setRightPanelMinHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    let frameId = 0;

    const measure = () => {
      if (leftPanelRef.current) {
        leftPanelRef.current.style.minHeight = "";
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.style.minHeight = "";
      }

      const leftCard = leftPanelRef.current?.querySelector(".panel");
      const rightCard = rightPanelRef.current?.querySelector(".panel");
      if (!(leftCard instanceof HTMLElement) || !(rightCard instanceof HTMLElement)) {
        return;
      }

      const leftRect = leftCard.getBoundingClientRect();
      const rightRect = rightCard.getBoundingClientRect();
      const nextHeights = getSidePanelMinHeights({
        leftHeight: leftRect.height,
        leftBottom: leftRect.bottom,
        rightHeight: rightRect.height,
        rightBottom: rightRect.bottom
      });

      setLeftPanelMinHeight((current) =>
        current === nextHeights.leftPanelMinHeight ? current : nextHeights.leftPanelMinHeight
      );
      setRightPanelMinHeight((current) =>
        current === nextHeights.rightPanelMinHeight ? current : nextHeights.rightPanelMinHeight
      );
    };

    const handleResize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measure);
    };

    frameId = window.requestAnimationFrame(measure);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, deps);

  return { leftPanelRef, rightPanelRef, leftPanelMinHeight, rightPanelMinHeight };
}
