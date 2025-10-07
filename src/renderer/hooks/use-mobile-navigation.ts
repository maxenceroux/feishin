import { useElementSize } from '@mantine/hooks';
import { useCallback, useEffect, useState } from 'react';

export const useMobileNavigation = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
    const { ref, width } = useElementSize();

    // Determine if we're on a mobile device based on screen width
    const isMobile = width > 0 && width <= 1024;
    const isTablet = width > 640 && width <= 1024;
    const isPhone = width > 0 && width <= 640;

    // Close menus when screen size changes to desktop
    useEffect(() => {
        if (!isMobile) {
            setIsMobileMenuOpen(false);
            setIsRightMenuOpen(false);
        }
    }, [isMobile]);

    // Close menus when clicking outside or on overlay
    const handleOverlayClick = useCallback(() => {
        setIsMobileMenuOpen(false);
        setIsRightMenuOpen(false);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
        // Close right menu if opening left menu
        if (!isMobileMenuOpen) {
            setIsRightMenuOpen(false);
        }
    }, [isMobileMenuOpen]);

    const toggleRightMenu = useCallback(() => {
        setIsRightMenuOpen(prev => !prev);
        // Close left menu if opening right menu
        if (!isRightMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [isRightMenuOpen]);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const closeRightMenu = useCallback(() => {
        setIsRightMenuOpen(false);
    }, []);

    return {
        // Screen size detection
        isMobile,
        isTablet,
        isPhone,
        width,
        ref,
        
        // Menu state
        isMobileMenuOpen,
        isRightMenuOpen,
        
        // Actions
        toggleMobileMenu,
        toggleRightMenu,
        closeMobileMenu,
        closeRightMenu,
        handleOverlayClick,
    };
};