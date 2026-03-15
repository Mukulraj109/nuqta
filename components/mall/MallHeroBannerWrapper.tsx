import React from 'react';
import MallHeroBanner from './MallHeroBanner';
import { useMallSection } from '@/hooks/useMallSection';

/**
 * Self-contained wrapper that fetches mall data and renders the hero banner.
 * Lazy-loaded in homepage to avoid importing mall APIs until Mall tab is active.
 */
const MallHeroBannerWrapper: React.FC = () => {
  const { heroBanners, isLoading } = useMallSection();

  return (
    <MallHeroBanner
      banners={heroBanners}
      isLoading={isLoading && !heroBanners.length}
    />
  );
};

export default React.memo(MallHeroBannerWrapper);
