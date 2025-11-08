// 360° flexible + never hidden
export function decidePopupPlacement({
  map,
  latlng,
  popupSize,
  padding = 12,   // min pixels from map edges
  gap = 10,       // space between marker and panel
  minScale = 0.6, // how small we allow shrinking (0.6 = 60%)
  preferOrder = null
}) {
  const container = map.getContainer();
  const rectC = container.getBoundingClientRect();

  const pt = map.latLngToContainerPoint(latlng); // pixel (x,y) in container
  const rawW = Math.max(1, popupSize.width || 1);
  const rawH = Math.max(1, popupSize.height || 1);

  const innerW = rectC.width  - 2 * padding;
  const innerH = rectC.height - 2 * padding;

  // Scale to ensure it fits the visible container (as a last resort).
  // Never upscale above 1; clamp down to minScale if needed.
  const fitScale = Math.min(1, innerW / rawW, innerH / rawH);
  const scale = Math.max(minScale, fitScale);
  const W = rawW * scale;
  const H = rawH * scale;

  // If no preference, try the side with the most free space first.
  if (!preferOrder) {
    const space = {
      left:   pt.x - padding,
      right:  rectC.width  - pt.x - padding,
      top:    pt.y - padding,
      bottom: rectC.height - pt.y - padding
    };
    preferOrder = Object.entries(space)
      .sort((a, b) => b[1] - a[1])
      .map(([dir]) => dir);
  }

  function rectFor(dir, ox = 0, oy = 0) {
    switch (dir) {
      case 'top': {
        const left   = pt.x - W / 2 + ox;
        const right  = left + W;
        const bottom = pt.y - gap + oy;
        const top    = bottom - H;
        return { left, right, top, bottom };
      }
      case 'bottom': {
        const left = pt.x - W / 2 + ox;
        const right = left + W;
        const top = pt.y + gap + oy;
        const bottom = top + H;
        return { left, right, top, bottom };
      }
      case 'left': {
        const right = pt.x - gap + ox;
        const left  = right - W;
        const top = pt.y - H / 2 + oy;
        const bottom = top + H;
        return { left, right, top, bottom };
      }
      case 'right': {
        const left = pt.x + gap + ox;
        const right = left + W;
        const top = pt.y - H / 2 + oy;
        const bottom = top + H;
        return { left, right, top, bottom };
      }
      default: return null;
    }
  }

  function solve(dir) {
    const minX = rectC.left + padding;
    const maxX = rectC.right - padding;
    const minY = rectC.top + padding;
    const maxY = rectC.bottom - padding;

    let ox = 0, oy = 0;
    let r = rectFor(dir, ox, oy);

    if (dir === 'top' || dir === 'bottom') {
      // Slide horizontally to fit
      const overL = Math.max(0, minX - (rectC.left + r.left));
      const overR = Math.max(0, (rectC.left + r.right) - maxX);
      ox += (overL - overR);
      r = rectFor(dir, ox, oy);

      // Nudge vertically if still needed (rare after scaling)
      const overT = Math.max(0, minY - (rectC.top + r.top));
      const overB = Math.max(0, (rectC.top + r.bottom) - maxY);
      oy += (overT - overB);
      r = rectFor(dir, ox, oy);
    } else {
      // left/right: slide vertically to fit
      const overT = Math.max(0, minY - (rectC.top + r.top));
      const overB = Math.max(0, (rectC.top + r.bottom) - maxY);
      oy += (overT - overB);
      r = rectFor(dir, ox, oy);

      // Nudge horizontally if needed
      const overL = Math.max(0, minX - (rectC.left + r.left));
      const overR = Math.max(0, (rectC.left + r.right) - maxX);
      ox += (overL - overR);
      r = rectFor(dir, ox, oy);
    }

    const dxL = Math.max(0, (rectC.left + padding) - (rectC.left + r.left));
    const dxR = Math.max(0, (rectC.left + r.right) - (rectC.right - padding));
    const dyT = Math.max(0, (rectC.top + padding) - (rectC.top + r.top));
    const dyB = Math.max(0, (rectC.top + r.bottom) - (rectC.bottom - padding));
    const overflow = dxL + dxR + dyT + dyB;

    return { dir, ox: Math.round(ox), oy: Math.round(oy), overflow };
  }

  let best = { dir: 'top', ox: 0, oy: 0, overflow: Number.POSITIVE_INFINITY };
  preferOrder.forEach((d) => {
    const res = solve(d);
    if (res.overflow < best.overflow) best = res;
  });

  const base = {
    top:    [0, -(gap + 8)],
    bottom: [0, +(gap + 8)],
    left:   [-(gap + 8), 0],
    right:  [+(gap + 8), 0],
  };

  const offset = base[best.dir].slice();
  if (best.dir === 'top' || best.dir === 'bottom') {
    offset[0] += best.ox; // slide x
    offset[1] += best.oy; // rare nudge y
  } else {
    offset[0] += best.ox; // rare nudge x
    offset[1] += best.oy; // slide y
  }

  // For smooth scaling from the marker side:
  const transformOrigin = ({
    top: '50% 100%',
    bottom: '50% 0%',
    left: '100% 50%',
    right: '0% 50%'
  })[best.dir];

  return {
    direction: best.dir,
    offset,
    scale,
    transformOrigin,
    // for convenience if you need container constraints:
    maxWidth: Math.floor(innerW),
    maxHeight: Math.floor(innerH),
  };
}
