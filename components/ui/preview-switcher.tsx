import React from 'react';
import { QuickPagePreview } from './quick-page-preview';
import { PagePreview } from './page-preview';
import { IframePagePreview } from './iframe-page-preview';
import { EnhancedIframePreview } from './enhanced-iframe-preview';

export type PreviewType = 'quick' | 'api' | 'iframe' | 'iframe-enhanced';

interface PreviewSwitcherProps {
  route: string;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  type?: PreviewType;
  enableScrollControl?: boolean;
  enableFullscreen?: boolean;
  enableZoom?: boolean;
  initialScrollMode?: boolean;
}

export const PreviewSwitcher: React.FC<PreviewSwitcherProps> = ({
  route,
  isVisible,
  position = 'bottom',
  className,
  type = 'quick', // По умолчанию используем быстрый предварительный просмотр
  enableScrollControl = true,
  enableFullscreen = true,
  enableZoom = true,
  initialScrollMode = false
}) => {
  switch (type) {
    case 'api':
      return (
        <PagePreview
          route={route}
          isVisible={isVisible}
          position={position}
          className={className}
        />
      );
    
    case 'iframe':
      return (
        <IframePagePreview
          route={route}
          isVisible={isVisible}
          position={position}
          className={className}
          enableScrollControl={enableScrollControl}
        />
      );
    
    case 'iframe-enhanced':
      return (
        <EnhancedIframePreview
          route={route}
          isVisible={isVisible}
          position={position}
          className={className}
          enableScrollControl={enableScrollControl}
          enableFullscreen={enableFullscreen}
          enableZoom={enableZoom}
          initialScrollMode={initialScrollMode}
        />
      );
    
    default:
      return (
        <QuickPagePreview
          route={route}
          isVisible={isVisible}
          position={position}
          className={className}
        />
      );
  }
};

export default PreviewSwitcher; 