import clsx from 'clsx';
import throttle from 'lodash/throttle';
import { motion } from 'motion/react';
import {
    CSSProperties,
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Outlet, useLocation } from 'react-router';

import styles from './main-content.module.css';

import { FullScreenOverlay } from '/@/renderer/layouts/default-layout/full-screen-overlay';
import { LeftSidebar } from '/@/renderer/layouts/default-layout/left-sidebar';
import { RightSidebar } from '/@/renderer/layouts/default-layout/right-sidebar';
import { useMobileNavigation } from '/@/renderer/hooks/use-mobile-navigation';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStoreActions, useSidebarStore } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';
import { constrainRightSidebarWidth, constrainSidebarWidth } from '/@/renderer/utils';
import { Spinner } from '/@/shared/components/spinner/spinner';

const SideDrawerQueue = lazy(() =>
    import('/@/renderer/layouts/default-layout/side-drawer-queue').then((module) => ({
        default: module.SideDrawerQueue,
    })),
);

const MINIMUM_SIDEBAR_WIDTH = 260;

export const MainContent = ({ shell }: { shell?: boolean }) => {
    const location = useLocation();
    const { collapsed, leftWidth, rightExpanded, rightWidth } = useSidebarStore();
    const { setSideBar } = useAppStoreActions();
    const { showQueueDrawerButton, sideQueueType } = useGeneralSettings();
    const [isResizing, setIsResizing] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    
    // Mobile navigation hook
    const {
        isMobile,
        isMobileMenuOpen,
        isRightMenuOpen,
        toggleMobileMenu,
        toggleRightMenu,
        handleOverlayClick,
        ref: mobileRef
    } = useMobileNavigation();

    const showSideQueue = rightExpanded && location.pathname !== AppRoute.NOW_PLAYING;
    const rightSidebarRef = useRef<HTMLDivElement | null>(null);

    const startResizing = useCallback((position: 'left' | 'right') => {
        if (position === 'left') return setIsResizing(true);
        return setIsResizingRight(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        setIsResizingRight(false);
    }, []);

    const resize = useCallback(
        (mouseMoveEvent: any) => {
            if (isResizing) {
                const width = mouseMoveEvent.clientX;
                const constrainedWidth = `${constrainSidebarWidth(width)}px`;

                if (width < MINIMUM_SIDEBAR_WIDTH - 100) {
                    setSideBar({ collapsed: true });
                } else {
                    setSideBar({ collapsed: false, leftWidth: constrainedWidth });
                }
            } else if (isResizingRight) {
                const start = Number(rightWidth.split('px')[0]);
                const { left } = rightSidebarRef!.current!.getBoundingClientRect();
                const width = `${constrainRightSidebarWidth(
                    start + left - mouseMoveEvent.clientX,
                )}px`;
                setSideBar({ rightWidth: width });
            }
        },
        [isResizing, isResizingRight, setSideBar, rightWidth],
    );

    const throttledResize = useMemo(() => throttle(resize, 50), [resize]);

    useEffect(() => {
        window.addEventListener('mousemove', throttledResize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', throttledResize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [throttledResize, stopResizing]);

    return (
        <motion.div
            className={clsx(styles.mainContentContainer, {
                [styles.rightExpanded]: showSideQueue && sideQueueType === 'sideQueue' && !isMobile,
                [styles.shell]: shell,
                [styles.sidebarCollapsed]: collapsed && !isMobile,
                [styles.sidebarExpanded]: !collapsed && !isMobile,
            })}
            id="main-content"
            ref={mobileRef}
            style={
                {
                    '--right-sidebar-width': rightWidth,
                    '--sidebar-width': leftWidth,
                } as CSSProperties
            }
        >
            {/* Mobile overlay when sidebars are open */}
            {isMobile && (isMobileMenuOpen || isRightMenuOpen) && (
                <div
                    className={styles['mobile-sidebar-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {!shell && (
                <>
                    <Suspense fallback={<></>}>
                        {showQueueDrawerButton && <SideDrawerQueue />}
                    </Suspense>
                    <FullScreenOverlay />
                    
                    {/* Desktop sidebars or mobile overlays */}
                    {isMobile ? (
                        <>
                            {/* Mobile left sidebar overlay */}
                            <div className={clsx(styles['mobile-sidebar'], {
                                [styles.open]: isMobileMenuOpen
                            })}>
                                <LeftSidebar 
                                    isResizing={isResizing} 
                                    startResizing={startResizing}
                                    isMobile={true}
                                    onClose={() => toggleMobileMenu()}
                                />
                            </div>
                            
                            {/* Mobile right sidebar overlay */}
                            {showSideQueue && (
                                <div className={clsx(styles['mobile-right-sidebar'], {
                                    [styles.open]: isRightMenuOpen
                                })}>
                                    <RightSidebar
                                        isResizing={isResizingRight}
                                        ref={rightSidebarRef}
                                        startResizing={startResizing}
                                        isMobile={true}
                                        onClose={() => toggleRightMenu()}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Desktop sidebars */}
                            <LeftSidebar isResizing={isResizing} startResizing={startResizing} />
                            <RightSidebar
                                isResizing={isResizingRight}
                                ref={rightSidebarRef}
                                startResizing={startResizing}
                            />
                        </>
                    )}
                </>
            )}
            
            {/* Main content area */}
            <div style={{ gridArea: isMobile ? 'auto' : 'content' }}>
                {/* Mobile navigation header */}
                {isMobile && !shell && (
                    <div className={styles['mobile-nav-header']}>
                        <button
                            className={styles['mobile-nav-button']}
                            onClick={toggleMobileMenu}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        
                        <span className={styles['mobile-nav-title']}>Feishin</span>
                        
                        {showQueueDrawerButton && (
                            <button
                                className={styles['mobile-nav-button']}
                                onClick={toggleRightMenu}
                                type="button"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}
                    </div>
                )}
                
                <Suspense fallback={<Spinner container />}>
                    <Outlet />
                </Suspense>
            </div>
        </motion.div>
    );
};
