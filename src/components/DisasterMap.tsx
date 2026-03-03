'use client';

import dynamic from 'next/dynamic';

const DisasterMap = dynamic(() => import('./DisasterMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-muted animate-pulse rounded-xl border border-border" />
  ),
});

export default DisasterMap;
