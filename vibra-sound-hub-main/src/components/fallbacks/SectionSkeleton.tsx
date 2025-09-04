import React from 'react';

// Fallback leve para seções grandes em lazy loading
export const SectionSkeleton: React.FC<{ height?: number | string }>=({ height=340 })=> (
  <div className="w-full animate-pulse" style={{ minHeight: typeof height==='number'? `${height}px`: height }}>
    <div className="h-full w-full rounded-xl bg-gradient-to-br from-muted/60 via-muted/30 to-muted/10 border border-border/40" />
  </div>
);

export default SectionSkeleton;
