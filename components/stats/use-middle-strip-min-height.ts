"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { getBottomAlignedStripMinHeight } from "@/lib/stats/middle-strip-height";

export function useMiddleStripMinHeight(deps: readonly unknown[]) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const leftTargetRef = useRef<HTMLDivElement | null>(null);
  const rightTargetRef = useRef<HTMLDivElement | null>(null);
  const [stripMinHeight, setStripMinHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    let frameId = 0;

    const measure = () => {
      if (stripRef.current) {
        stripRef.current.style.minHeight = "";
      }

      const stripElement = stripRef.current;
      const leftCard = leftTargetRef.current?.querySelector(".panel");
      const rightCard = rightTargetRef.current?.querySelector(".panel");
      if (
        !(stripElement instanceof HTMLElement) ||
        !(leftCard instanceof HTMLElement) ||
        !(rightCard instanceof HTMLElement)
      ) {
        return;
      }

      const stripRect = stripElement.getBoundingClientRect();
      const leftRect = leftCard.getBoundingClientRect();
      const rightRect = rightCard.getBoundingClientRect();
      const targetBottom = Math.max(leftRect.bottom, rightRect.bottom);
      const nextMinHeight = getBottomAlignedStripMinHeight({
        stripTop: stripRect.top,
        targetBottom
      });

      setStripMinHeight((current) =>
        current === nextMinHeight ? current : nextMinHeight
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

  return { stripRef, leftTargetRef, rightTargetRef, stripMinHeight };
}
