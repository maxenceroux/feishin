import { useElementSize } from '@mantine/hooks';

interface UseContainerQueryProps {
    lg?: number;
    md?: number;
    sm?: number;
    xl?: number;
    xs?: number;
}

export const useContainerQuery = (props?: UseContainerQueryProps) => {
    const { lg, md, sm, xl, xs } = props || {};
    const { height, ref, width } = useElementSize();

    // Mobile-first breakpoints
    const isXs = width >= (xs || 0);
    const isSm = width >= (sm || 480);    // Small phones
    const isMd = width >= (md || 768);    // Tablets
    const isLg = width >= (lg || 1024);   // Laptops
    const isXl = width >= (xl || 1280);   // Large screens

    // Convenience flags for mobile/desktop
    const isMobile = width > 0 && width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    return { 
        height, 
        isLg, 
        isMd, 
        isSm, 
        isXl, 
        isXs, 
        ref, 
        width,
        isMobile,
        isTablet,
        isDesktop
    };
};
