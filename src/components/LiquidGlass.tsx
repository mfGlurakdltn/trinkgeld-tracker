import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

function buildDisplacementMap(
  width: number,
  height: number,
  borderRadius: number,
  depth: number
): string {
  if (typeof document === 'undefined' || width <= 0 || height <= 0) return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, width, height);

  const edgeWidth = depth * 3;
  const r = borderRadius;

  for (let y = 0; y < edgeWidth; y++) {
    const t = y / edgeWidth;
    const intensity = Math.pow(1 - t, 2.2) * depth;
    for (let x = 0; x < width; x++) {
      const distFromLeft = x;
      const distFromRight = width - x;
      let cornerFade = 1;
      if (distFromLeft < r && y < r) {
        const dx = r - distFromLeft, dy = r - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        cornerFade = dist < r ? Math.pow(Math.max(0, dist / r), 0.5) : 0;
      }
      if (distFromRight < r && y < r) {
        const dx = r - distFromRight, dy = r - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        cornerFade = dist < r ? Math.pow(Math.max(0, dist / r), 0.5) : 0;
      }
      const val = 128 + intensity * cornerFade;
      ctx.fillStyle = `rgb(128,${Math.min(255, val)},128)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  for (let y = 0; y < edgeWidth; y++) {
    const t = y / edgeWidth;
    const intensity = Math.pow(1 - t, 2.2) * depth;
    for (let x = 0; x < width; x++) {
      const val = 128 - intensity;
      ctx.fillStyle = `rgb(128,${Math.max(0, val)},128)`;
      ctx.fillRect(x, height - 1 - y, 1, 1);
    }
  }

  for (let x = 0; x < edgeWidth; x++) {
    const t = x / edgeWidth;
    const intensity = Math.pow(1 - t, 2.2) * depth;
    for (let y = edgeWidth; y < height - edgeWidth; y++) {
      const val = 128 + intensity;
      ctx.fillStyle = `rgb(${Math.min(255, val)},128,128)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  for (let x = 0; x < edgeWidth; x++) {
    const t = x / edgeWidth;
    const intensity = Math.pow(1 - t, 2.2) * depth;
    for (let y = edgeWidth; y < height - edgeWidth; y++) {
      const val = 128 - intensity;
      ctx.fillStyle = `rgb(${Math.max(0, val)},128,128)`;
      ctx.fillRect(width - 1 - x, y, 1, 1);
    }
  }

  return canvas.toDataURL('image/png');
}

interface LiquidGlassProps {
  id: string;
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  depth?: number;
  strength?: number;
  blur?: number;
  chromaticAberration?: number;
  tintColor?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function LiquidGlass({
  id,
  children,
  width,
  height,
  borderRadius = 24,
  depth = 10,
  strength = 55,
  blur = 0.6,
  chromaticAberration = 1.4,
  tintColor = 'rgba(255,255,255,0.03)',
  className = '',
  style,
  onClick,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState({ w: 0, h: 0 });

  const explicitWidth = typeof width === 'number' ? width : 0;
  const explicitHeight = typeof height === 'number' ? height : 0;

  useEffect(() => {
    if (explicitWidth && explicitHeight) {
      setMeasured({ w: explicitWidth, h: explicitHeight });
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setMeasured({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [explicitWidth, explicitHeight]);

  const filterId = `liquid-${id}`;

  const mapData = useMemo(
    () => buildDisplacementMap(measured.w, measured.h, borderRadius, depth),
    [measured.w, measured.h, borderRadius, depth]
  );

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={className}
      style={{
        width: width ?? '100%',
        height: height,
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        ...style,
      }}
    >
      {mapData && (
        <svg
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapData}
                result="dispMap"
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
              />
              <feGaussianBlur in="dispMap" stdDeviation={blur} result="dispBlur" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispBlur"
                scale={strength}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feOffset in="displaced" dx={chromaticAberration} dy={0} result="redShift" />
              <feColorMatrix
                in="redShift"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="redOnly"
              />
              <feColorMatrix
                in="displaced"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="greenOnly"
              />
              <feOffset in="displaced" dx={-chromaticAberration} dy={0} result="blueShift" />
              <feColorMatrix
                in="blueShift"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="blueOnly"
              />
              <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
              <feBlend in="rg" in2="blueOnly" mode="screen" result="final" />
            </filter>
          </defs>
        </svg>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          backdropFilter: mapData
            ? `url(#${filterId}) brightness(1.08) saturate(1.3)`
            : 'blur(12px) brightness(1.05) saturate(1.2)',
          WebkitBackdropFilter: mapData
            ? (`url(#${filterId}) brightness(1.08) saturate(1.3)` as string)
            : 'blur(12px) brightness(1.05) saturate(1.2)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          background: tintColor,
          backdropFilter: 'blur(1px)',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          boxShadow: `
            inset 0 1px 1px rgba(255,255,255,0.35),
            inset 0 -1px 1px rgba(0,0,0,0.15),
            inset 1px 0 1px rgba(255,255,255,0.08),
            inset -1px 0 1px rgba(255,255,255,0.08)
          `,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '8%',
          right: '8%',
          height: 1,
          borderRadius: '0 0 50% 50%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: borderRadius + 1,
          border: '1px solid rgba(255,255,255,0.12)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 4, height: '100%' }}>{children}</div>
    </div>
  );
}
