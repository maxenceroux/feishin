// Mobile-first responsive breakpoints
const breakpoints = {
    xs: '480px',    // Small phones
    sm: '640px',    // Large phones
    md: '768px',    // Tablets
    lg: '1024px',   // Small laptops
    xl: '1280px',   // Large laptops
    '2xl': '1536px' // Desktops
};

// Mobile-first media queries
export const device = {
    // Max-width queries for smaller devices
    mobile: `(max-width: ${breakpoints.sm})`,
    tablet: `(max-width: ${breakpoints.md})`,
    laptop: `(max-width: ${breakpoints.lg})`,
    
    // Min-width queries for larger devices (mobile-first)
    fromSm: `(min-width: ${breakpoints.sm})`,
    fromMd: `(min-width: ${breakpoints.md})`,
    fromLg: `(min-width: ${breakpoints.lg})`,
    fromXl: `(min-width: ${breakpoints.xl})`,
    from2xl: `(min-width: ${breakpoints['2xl']})`,
    
    // Touch device detection
    touch: '(hover: none) and (pointer: coarse)',
    hover: '(hover: hover) and (pointer: fine)'
};

// Legacy support for existing code
export const size = {
    desktop: '320px',
    mobile: '640px',
};
