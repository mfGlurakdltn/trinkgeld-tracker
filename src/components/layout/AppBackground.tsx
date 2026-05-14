import { useBackground } from '@/contexts/BackgroundContext';

export default function AppBackground() {
  const { def } = useBackground();

  if (!def.blobs.length) return null;

  const positions = [
    { w: 500, h: 500, top: '5%', right: '-5%', blur: 30, anim: 'drift1 18s ease-in-out infinite' },
    { w: 400, h: 400, bottom: '10%', left: '-5%', blur: 40, anim: 'drift2 22s ease-in-out infinite' },
    { w: 300, h: 300, top: '45%', left: '40%', blur: 25, anim: 'drift3 15s ease-in-out infinite' },
    { w: 120, h: 120, top: '30%', left: '20%', blur: 15, anim: 'pulseSlow 6s ease-in-out infinite' },
  ];

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {def.blobs.map((b, i) => {
        const p = positions[i] || positions[positions.length - 1];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.w,
              height: p.h,
              top: (p as { top?: string }).top,
              bottom: (p as { bottom?: string }).bottom,
              left: (p as { left?: string }).left,
              right: (p as { right?: string }).right,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              filter: `blur(${p.blur}px)`,
              animation: p.anim,
            }}
          />
        );
      })}
    </div>
  );
}
