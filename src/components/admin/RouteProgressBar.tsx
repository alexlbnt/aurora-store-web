"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // A rota chegou: completa a barra (ajuste durante a renderização) e some logo depois.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [shownRoute, setShownRoute] = useState(routeKey);
  const [finishing, setFinishing] = useState(false);
  if (shownRoute !== routeKey) {
    setShownRoute(routeKey);
    if (isNavigating) {
      setProgress(100);
      setFinishing(true);
    }
  }

  useEffect(() => {
    if (!finishing) return;
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
      setFinishing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [finishing]);

  // Intercept clicks on links to show immediate progress
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || target.target === "_blank") {
        return;
      }

      // If it's an internal link leading to a different path or query
      try {
        const url = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin === currentUrl.origin && (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search)) {
          setIsNavigating(true);
          setProgress(25);
          setTimeout(() => setProgress((prev) => (prev < 80 ? 70 : prev)), 100);
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-amber-500 to-primary transition-all duration-200 ease-out shadow-[0_0_8px_rgba(217,119,6,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}
