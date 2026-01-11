import React from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { decidePopupPlacement } from "./decidePopupPlacement";

export default function EdgeAwareTooltipMarker({ position, icon, children }) {
  const map = useMap();

  // placement state we inject into the Tooltip and wrapper
  const [placement, setPlacement] = React.useState({
    direction: "top",
    offset: [0, -42],
    scale: 1,
    transformOrigin: "50% 100%",
    maxWidth: 1000,
    maxHeight: 1000,
  });

  const innerRef = React.useRef(null);
  const roRef = React.useRef(null);
  const isOpenRef = React.useRef(false);
  const lastLatLngRef = React.useRef(null);

  // Measure the inner content (unscaled) to compute placement
  const recomputePlacement = React.useCallback(() => {
    const el = innerRef.current;
    if (!el || !lastLatLngRef.current) return;

    // Temporarily remove scale to measure natural size
    const prevTransform = el.style.transform;
    el.style.transform = "none";

    const width = el.offsetWidth;
    const height = el.offsetHeight;

    // Restore transform immediately after measurement
    el.style.transform = prevTransform || "";

    const res = decidePopupPlacement({
      map,
      latlng: lastLatLngRef.current,
      popupSize: { width, height },
      padding: 12,
      gap: 10,
      minScale: 0.6, // tweak if you want smaller/larger minimum
    });

    setPlacement(res);
  }, [map]);

  // Handle tooltip open/close
  const onTooltipOpen = React.useCallback(
    (e) => {
      isOpenRef.current = true;
      lastLatLngRef.current = e.latlng;

      // Wait for DOM to paint, then measure & place
      requestAnimationFrame(() => {
        recomputePlacement();

        // Observe size changes while open (dynamic content)
        if (innerRef.current) {
          // Clean any previous observer
          if (roRef.current) {
            try { roRef.current.disconnect(); } catch {}
          }
          roRef.current = new ResizeObserver(() => {
            if (isOpenRef.current) recomputePlacement();
          });
          roRef.current.observe(innerRef.current);
        }
      });
    },
    [recomputePlacement]
  );

  const onTooltipClose = React.useCallback(() => {
    isOpenRef.current = false;
    if (roRef.current) {
      try { roRef.current.disconnect(); } catch {}
      roRef.current = null;
    }
  }, []);

  // Inject placement props into the Tooltip child and wrap its content to apply scaling
  const enhancedChildren = React.Children.map(children, (child) => {
    const isLeafletTooltip =
      child &&
      (child.type?.displayName === "Tooltip" ||
        child.type?.name === "Tooltip");

    if (!isLeafletTooltip) return child;

    // Extract original content
    const originalContent = child.props.children;

    // Clone the Tooltip with direction/offset applied (arrow + base position),
    // and wrap its children with a scaling container.
    return React.cloneElement(
      child,
      {
        direction: placement.direction,
        offset: placement.offset,
      },
      <div
        ref={innerRef}
        style={{
          transform: `scale(${placement.scale})`,
          transformOrigin: placement.transformOrigin,
          maxWidth: placement.maxWidth,
          maxHeight: placement.maxHeight,
          overflow: "auto",
          // small polish for smoother transforms
          willChange: "transform",
        }}
      >
        {originalContent}
      </div>
    );
  });

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        tooltipopen: onTooltipOpen,
        tooltipclose: onTooltipClose,
      }}
    >
      {/* We must render a Tooltip as a child for the handlers to fire */}
      {enhancedChildren}
    </Marker>
  );
}
