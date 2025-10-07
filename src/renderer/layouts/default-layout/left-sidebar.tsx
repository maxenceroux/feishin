import { useRef } from 'react';

import styles from './left-sidebar.module.css';

import { ResizeHandle } from '/@/renderer/features/shared';
import { CollapsedSidebar } from '/@/renderer/features/sidebar/components/collapsed-sidebar';
import { Sidebar } from '/@/renderer/features/sidebar/components/sidebar';
import { useSidebarStore } from '/@/renderer/store';

interface LeftSidebarProps {
    isResizing: boolean;
    startResizing: (direction: 'left' | 'right') => void;
    isMobile?: boolean;
    onClose?: () => void;
}

export const LeftSidebar = ({ isResizing, startResizing, isMobile = false, onClose }: LeftSidebarProps) => {
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const { collapsed } = useSidebarStore();

    return (
        <aside className={styles.container} id="sidebar">
            {/* Mobile close button */}
            {isMobile && onClose && (
                <div style={{ 
                    position: 'sticky', 
                    top: 0, 
                    padding: '1rem', 
                    background: 'var(--theme-colors-background-alternate)',
                    borderBottom: '1px solid var(--theme-colors-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ 
                        fontWeight: 600, 
                        color: 'var(--theme-colors-text)' 
                    }}>
                        Navigation
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--theme-colors-text)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        type="button"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            )}
            
            {/* Resize handle only for desktop */}
            {!isMobile && (
                <ResizeHandle
                    isResizing={isResizing}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        startResizing('left');
                    }}
                    placement="right"
                    ref={sidebarRef}
                />
            )}
            
            {/* Always show expanded sidebar on mobile, respect collapsed state on desktop */}
            {(isMobile || !collapsed) ? <Sidebar /> : <CollapsedSidebar />}
        </aside>
    );
};
