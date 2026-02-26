const cache = new Set<string>();

export function clearImageCache(): void {
    cache.clear();
}

export function isImageCached(src: string | string[]): boolean {
    const urls = Array.isArray(src) ? src : [src];
    return urls.some((url) => cache.has(url));
}

export function markImageLoaded(src: string | string[]): void {
    const urls = Array.isArray(src) ? src : [src];
    for (const url of urls) {
        cache.add(url);
    }
}
