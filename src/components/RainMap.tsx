'use client';

import dynamic from 'next/dynamic';

const RainMap = dynamic(() => import('./RainMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-muted animate-pulse rounded-xl border border-border" />
  ),
});

export default RainMap;
