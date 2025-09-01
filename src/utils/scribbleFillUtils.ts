import * as d3 from 'd3';

interface PatternCacheEntry {
    patternUrl: string;
    patternId: string;
    defsElement: SVGDefsElement;
    lastUsed: number;
}

interface PatternCacheKey {
    type: 'scribble' | 'oilpaint';
    color: string;
    direction?: number;
    density?: number;
    width?: number;
    height?: number;
    seed?: string; // Add seed for controlled randomization
    variation?: string; // Add variation identifier
}

// Utility calss for creating hand-drawn style fills using D3.js.
// Directional scribble patterns and oil paint textures are generated with customizable parameters.
export class ScribbleFillUtils {
    private static patternCache = new Map<string, PatternCacheEntry>();
    private static maxCacheSize = 50;
    private static cacheExpirationTime = 5 * 60 * 1000; // 5 minutes

    // Seeded random number generator for consistent but varied patterns
    private static seededRandom(seed: string): () => number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return function() {
            hash = (hash * 9301 + 49297) % 233280;
            return hash / 233280;
        };
    }

    // Generate natural variation parameters based on color and position
    private static generateNaturalVariation(color: string, index: number, total: number): {
        direction: number;
        density: number;
        strokeVariation: number;
        opacityVariation: number;
    } {
        const seed = `${color}-${index}-${total}`;
        const rng = this.seededRandom(seed);
        
        // More natural direction distribution (avoid perfect angles)
        const baseDirection = (index / total) * 180;
        const directionJitter = (rng() - 0.5) * 30; // ±15 degrees
        const direction = (baseDirection + directionJitter + 360) % 180;
        
        // Higher base density for better coverage
        const baseDensity = 12 + (index % 3) * 2; // 12, 14, or 16
        const densityVariation = Math.floor(rng() * 4 - 2); // ±2
        const density = Math.max(10, Math.min(20, baseDensity + densityVariation)); // Min 10, max 20
        
        // Natural stroke and opacity variations
        const strokeVariation = 0.5 + rng() * 1.0; // 0.5 to 1.5
        const opacityVariation = 0.7 + rng() * 0.3; // 0.7 to 1.0
        
        return { direction, density, strokeVariation, opacityVariation };
    }

    // Generate a cache key for a pattern
    private static generateCacheKey(key: PatternCacheKey): string {
        const parts = [key.type, key.color];
        if (key.direction !== undefined) parts.push(`dir:${Math.round(key.direction * 10) / 10}`);
        if (key.density !== undefined) parts.push(`dens:${key.density}`);
        if (key.width !== undefined) parts.push(`w:${key.width}`);
        if (key.height !== undefined) parts.push(`h:${key.height}`);
        if (key.seed !== undefined) parts.push(`seed:${key.seed}`);
        if (key.variation !== undefined) parts.push(`var:${key.variation}`);
        return parts.join('|');
    }

    // Clean up expired cache entries
    private static cleanupCache(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.patternCache) {
            if (now - entry.lastUsed > this.cacheExpirationTime) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => {
            const entry = this.patternCache.get(key);
            if (entry) {
                // Remove the pattern element from the DOM
                const patternElement = entry.defsElement.querySelector(`#${entry.patternId}`);
                if (patternElement) {
                    patternElement.remove();
                }
                this.patternCache.delete(key);
            }
        });

        // If cache is still too large, remove oldest entries
        if (this.patternCache.size > this.maxCacheSize) {
            const sortedEntries = Array.from(this.patternCache.entries())
                .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

            const toRemove = sortedEntries.slice(0, sortedEntries.length - this.maxCacheSize);
            toRemove.forEach(([key, entry]) => {
                const patternElement = entry.defsElement.querySelector(`#${entry.patternId}`);
                if (patternElement) {
                    patternElement.remove();
                }
                this.patternCache.delete(key);
            });
        }
    }

    // Get a cached pattern or create a new one
    private static getCachedPattern(
        cacheKey: PatternCacheKey,
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        createPatternFn: () => string
    ): string {
        const key = this.generateCacheKey(cacheKey);
        const defsNode = defs.node();
        
        if (!defsNode) {
            return createPatternFn();
        }

        const cached = this.patternCache.get(key);
        if (cached && cached.defsElement === defsNode) {
            // Check if the pattern still exists in the DOM
            const patternExists = defsNode.querySelector(`#${cached.patternId}`);
            if (patternExists) {
                cached.lastUsed = Date.now();
                return cached.patternUrl;
            } else {
                // Pattern was removed from DOM, remove from cache
                this.patternCache.delete(key);
            }
        }

        // Create new pattern
        const patternUrl = createPatternFn();
        const patternId = patternUrl.replace('url(#', '').replace(')', '');

        this.patternCache.set(key, {
            patternUrl,
            patternId,
            defsElement: defsNode,
            lastUsed: Date.now()
        });

        // Clean up cache periodically
        if (this.patternCache.size > this.maxCacheSize * 0.8) {
            this.cleanupCache();
        }

        return patternUrl;
    }

    // Clear all cached patterns
    static clearPatternCache(): void {
        this.patternCache.clear();
    }
    static createDirectionalScribblePattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string,
        density: number,
        width: number,
        height: number,
        angle: number
    ): string {
        // Add noise filter for paper feel background fill of scribble patterns
        // TODO: Move SVG filter creationg to a seperate static method and remove duplication from there.
        const filterId = `grainy-filter-${id}`;
        defs.select(`#${filterId}`).remove(); // clean up duplicates

        const filter = defs.append("filter")
            .attr("id", filterId)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "200%")
            .attr("height", "200%");

        // Fractal noise (base for grain)
        filter.append('feTurbulence')
            .attr('type', 'fractalNoise')
            .attr("baseFrequency", 0.4) // reduced noise frequency
            .attr("result", "noise");

        // Blend subtly with the original (preserve color vibrancy)
        const lighting = filter.append('feDiffuseLighting')
            .attr('in', 'noise')
            .attr('lighting-color', 'white')
            .attr('surfaceScale', 2);

        lighting.append('feDistantLight')
            .attr('azimuth', 45)
            .attr('elevation', 75);

        // Create element for the pattern to be used in the fill
        const pattern = defs
            .append("pattern")
            .attr("id", id)
            .attr("width", width)
            .attr("height", height)
            .attr("patternUnits", "userSpaceOnUse");

        // Create pastel patches for the background with randomized sizes and positions
        const patchCount = 6;
        for (let i = 0; i < patchCount; i++) {
            const pastel = this.toPastelColor(color, 0.08 + Math.random() * 0.015);
            const offsetX = (Math.random() - 0.8) * width * 0.08;
            const offsetY = (Math.random() - 0.5) * height * 0.05;
            const w = width * (0.6 + Math.random() * 0.4);
            const h = height * (0.7 + Math.random() * 0.3);

            pattern.append("rect")
                .attr("x", offsetX)
                .attr("y", offsetY)
                .attr("width", w)
                .attr("height", h)
                .attr("fill", pastel)
                .attr("filter", `url(#${filterId})`);
        }

        // Add watercolor texture to the pattern
        // TODO: make blobs count configurable
        this.addWatercolorTexture(pattern, width, height, color, 4);

        // Create the scribble lines with given angle and density
        const group = pattern
            .append("g")
            .attr("transform", `rotate(${angle}, ${width / 2}, ${height / 2})`);

        const spacing = width / density;
        for (let i = -width; i < width * 2; i += spacing) {
            const path = this.generateWavyLine(i, 0, i, height);
            group
                .append("path")
                .attr("d", path)
                .attr("stroke", color)
                .attr("stroke-width", 1 + Math.random())
                .attr("stroke-opacity", 0.8 + Math.random() * 0.2)
                .attr("fill", "none");
        }

        // Apply blur filter to add a soft watercolor effect
        this.ensureWatercolorBlurFilter(defs);

        return `url(#${id})`;
    }

    // Generates a wavy line path string between two points.
    static generateWavyLine(x1: number, y1: number, x2: number, y2: number): string {
        const segments = 10;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const amplitude = 1.5;

        let d = `M ${x1} ${y1}`;
        for (let i = 1; i <= segments; i++) {
            const cx = x1 + dx * i + (Math.random() - 0.5) * amplitude;
            const cy = y1 + dy * i + (Math.random() - 0.5) * amplitude;
            d += ` L ${cx} ${cy}`;
        }

        return d;
    }

    // Enhanced wavy line with seeded randomization and natural variations
    private static generateEnhancedWavyLine(x1: number, y1: number, x2: number, y2: number, rng: () => number): string {
        const segments = 8 + Math.floor(rng() * 5); // 8-12 segments for variation
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const amplitude = 1.0 + rng() * 1.0; // Variable amplitude

        let d = `M ${x1} ${y1}`;
        let prevAmplitude = 0;
        
        for (let i = 1; i <= segments; i++) {
            // Create smooth amplitude transitions
            const targetAmplitude = (rng() - 0.5) * amplitude;
            const currentAmplitude = prevAmplitude + (targetAmplitude - prevAmplitude) * 0.3;
            
            const cx = x1 + dx * i + currentAmplitude;
            const cy = y1 + dy * i + (rng() - 0.5) * amplitude * 0.5;
            
            // Use curves for more natural lines
            if (i === 1) {
                d += ` Q ${cx} ${cy} ${x1 + dx * i} ${y1 + dy * i}`;
            } else {
                d += ` T ${cx} ${cy}`;
            }
            
            prevAmplitude = currentAmplitude;
        }

        return d;
    }

    // Enhanced watercolor texture with natural blob variations
    private static addEnhancedWatercolorTexture(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        width: number,
        height: number,
        color: string,
        numBlobs: number,
        rng: () => number
    ): void {
        for (let i = 0; i < numBlobs; i++) {
            // More vibrant color variation
            const hueShift = -20 + rng() * 40; // ±20 hue shift (less extreme)
            const saturationShift = -0.05 + rng() * 0.2; // Keep more saturation
            const blobColor = this.adjustColor(color, hueShift, saturationShift);

            // Better coverage distribution
            const cx = (rng() * 0.8 + 0.1) * width; // 10-90% coverage
            const cy = (rng() * 0.8 + 0.1) * height;
            
            // More natural size distribution with better coverage
            const sizeCategory = rng();
            let rx, ry;
            if (sizeCategory < 0.4) { // 40% large blobs for better coverage
                rx = 20 + rng() * 40;
                ry = 15 + rng() * 35;
            } else if (sizeCategory < 0.8) { // 40% medium blobs
                rx = 12 + rng() * 18;
                ry = 10 + rng() * 15;
            } else { // 20% small detail blobs
                rx = 5 + rng() * 8;
                ry = 4 + rng() * 6;
            }

            const blobPath = this.createEnhancedOrganicBlob(cx, cy, rx, ry, rng);

            // Higher opacity for better color coverage
            const baseOpacity = rx > 25 ? 0.15 : (rx > 12 ? 0.25 : 0.35);
            const opacity = baseOpacity + rng() * 0.15;

            pattern.append("path")
                .attr("d", blobPath)
                .attr("fill", blobColor)
                .attr("fill-opacity", opacity)
                .attr("stroke", "none")
                .attr("filter", "url(#watercolor-soft-blur)");
        }
    }

    // Enhanced organic blob with more natural variation
    private static createEnhancedOrganicBlob(cx: number, cy: number, rx: number, ry: number, rng: () => number): string {
        const points = 6 + Math.floor(rng() * 4); // 6-9 points for natural variation
        const angleStep = (Math.PI * 2) / points;
        const path: [number, number][] = [];

        for (let i = 0; i < points; i++) {
            const angle = i * angleStep + (rng() - 0.5) * 0.5; // Slight angle variation
            const radiusVariationX = 0.7 + rng() * 0.6; // More extreme variation
            const radiusVariationY = 0.7 + rng() * 0.6;
            
            const x = cx + Math.cos(angle) * rx * radiusVariationX;
            const y = cy + Math.sin(angle) * ry * radiusVariationY;
            path.push([x, y]);
        }

        // Create smooth curves using cubic bezier
        let d = `M ${path[0][0]} ${path[0][1]}`;
        for (let i = 1; i < path.length; i++) {
            const [x, y] = path[i];
            const [prevX, prevY] = path[i - 1];
            const [nextX, nextY] = path[(i + 1) % path.length];
            
            // Control points for smooth curves
            const cp1x = prevX + (x - prevX) * 0.5 + (rng() - 0.5) * 5;
            const cp1y = prevY + (y - prevY) * 0.5 + (rng() - 0.5) * 5;
            const cp2x = x + (nextX - x) * 0.2;
            const cp2y = y + (nextY - y) * 0.2;
            
            d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`;
        }
        d += " Z";

        return d;
    }

    // Generate natural scribble lines that cover full area with organic endpoints
    private static generateNaturalScribbleLine(x1: number, y1: number, x2: number, y2: number, rng: () => number): string {
        const segments = 8 + Math.floor(rng() * 4); // 8-11 segments - optimized count
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const amplitude = 1.2 + rng() * 0.8; // Moderate amplitude for natural feel
        
        let d = `M ${x1} ${y1}`;
        let prevWaver = 0;
        
        for (let i = 1; i <= segments; i++) {
            // Natural waviness that varies smoothly
            const targetWaver = (rng() - 0.5) * amplitude;
            const currentWaver = prevWaver + (targetWaver - prevWaver) * 0.5; // Smooth transition
            
            const baseX = x1 + dx * i;
            const baseY = y1 + dy * i;
            
            const cx = baseX + currentWaver;
            const cy = baseY + (rng() - 0.5) * amplitude * 0.4;
            
            // Add very slight endpoint variation for natural feel (but still covers area)
            if (i === segments) {
                const endVariation = (rng() - 0.5) * 3; // Very small variation ±3px
                d += ` L ${cx + endVariation} ${cy + endVariation}`;
            } else {
                d += ` L ${cx} ${cy}`;
            }
            
            prevWaver = currentWaver;
        }
        
        return d;
    }

    // Create a soft-edged patch that looks like smeared paint with faded borders
    private static createSoftEdgedPatch(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        color: string,
        x: number,
        y: number,
        width: number,
        height: number,
        opacity: number,
        patchId: string,
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        rng: () => number
    ): void {
        // Create gradient for soft faded edges
        const gradientId = `soft-gradient-${patchId}`;
        defs.select(`#${gradientId}`).remove(); // Clean up existing

        const gradient = defs.append('radialGradient')
            .attr('id', gradientId)
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '70%'); // Larger radius for softer edges

        // Create natural fade from center to edge
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color)
            .attr('stop-opacity', opacity);

        gradient.append('stop')
            .attr('offset', '60%') // Fade starts at 60%
            .attr('stop-color', color)
            .attr('stop-opacity', opacity * 0.6);

        gradient.append('stop')
            .attr('offset', '85%') // More gradual fade
            .attr('stop-color', color)
            .attr('stop-opacity', opacity * 0.2);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color)
            .attr('stop-opacity', 0); // Completely faded edge

        // Create organic shape for the patch (not rectangle)
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const avgRadius = Math.min(width, height) / 2;
        
        // Create organic blob with natural variations
        const blobPath = this.createOrganicPaintSmear(centerX, centerY, avgRadius, rng);

        pattern.append('path')
            .attr('d', blobPath)
            .attr('fill', `url(#${gradientId})`)
            .attr('stroke', 'none');
    }

    // Create an organic paint smear shape that looks naturally applied
    private static createOrganicPaintSmear(cx: number, cy: number, radius: number, rng: () => number): string {
        const points = 8 + Math.floor(rng() * 4); // 8-11 points for natural variation
        const angleStep = (Math.PI * 2) / points;
        const path: [number, number][] = [];

        for (let i = 0; i < points; i++) {
            const angle = i * angleStep + (rng() - 0.5) * 0.8; // More angle variation
            
            // Create natural paint smear variations
            const radiusVariation = 0.6 + rng() * 0.8; // 0.6 to 1.4 variation
            const smearEffect = 1 + (rng() - 0.5) * 0.6; // Smearing effect
            
            const actualRadius = radius * radiusVariation * smearEffect;
            const x = cx + Math.cos(angle) * actualRadius;
            const y = cy + Math.sin(angle) * actualRadius;
            
            path.push([x, y]);
        }

        // Create smooth organic curves using quadratic bezier
        let d = `M ${path[0][0]} ${path[0][1]}`;
        
        for (let i = 0; i < path.length; i++) {
            const current = path[i];
            const next = path[(i + 1) % path.length];
            const controlOffset = radius * 0.3 * (rng() - 0.5); // Natural control point variation
            
            const controlX = (current[0] + next[0]) / 2 + controlOffset;
            const controlY = (current[1] + next[1]) / 2 + controlOffset;
            
            d += ` Q ${controlX} ${controlY} ${next[0]} ${next[1]}`;
        }
        
        d += ' Z';
        return d;
    }

    // Converts any color to authentic pastel/pencil colors like hand-drawn art
    static toPastelColor(baseColor: string, alpha: number = 0.12): string {
        const d3Color = d3.color(baseColor);
        if (d3Color) {
            const hsl = d3.hsl(d3Color);
            
            // Create authentic pastel/pencil color transformations
            const hueJitter = (Math.random() - 0.5) * 12; // More hue variation for natural feel
            const satJitter = (Math.random() - 0.5) * 0.2;
            const lightJitter = (Math.random() - 0.5) * 0.15;

            hsl.h += hueJitter;
            
            // Transform to pastel/pencil color characteristics
            // Pastels have medium saturation (not too vibrant, not too dull)
            hsl.s = Math.max(0.35, Math.min(0.75, hsl.s * 0.8 + satJitter));
            
            // Pencil colors are slightly lighter but not washed out
            hsl.l = Math.max(0.55, Math.min(0.8, hsl.l * 1.15 + lightJitter));

            return `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${alpha})`;
        }

        // Fallback to warm neutral pastel
        return `hsla(45, 35%, 75%, ${alpha})`;
    }

    // Convert colors to authentic pencil-like colors (slightly different from pastels)
    static toPencilColor(baseColor: string, alpha: number = 0.3): string {
        const d3Color = d3.color(baseColor);
        if (d3Color) {
            const hsl = d3.hsl(d3Color);
            
            // Pencil colors have subtle variations and earthy tones
            const hueShift = (Math.random() - 0.5) * 15;
            hsl.h += hueShift;
            
            // Pencil colors are more muted than pastels
            hsl.s = Math.max(0.25, Math.min(0.65, hsl.s * 0.7));
            
            // Slightly darker than pastels for pencil effect
            hsl.l = Math.max(0.45, Math.min(0.75, hsl.l * 1.05));

            return `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${alpha})`;
        }

        return `hsla(30, 25%, 65%, ${alpha})`;
    }

    // Main method to create a set of scribble patterns with different colors and directions.
    // The patterns are designed to simulate a hand-drawn effect with varying densities and angles.
    static createScribblePatternSet(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        colors: string[]
    ): string[] {
        // Ensure we always have colors to work with
        const safeColors = colors.length > 0 ? colors : ['#666666']; // Fallback to gray
        
        return safeColors.map((color, index) => {
            try {
                const variation = this.generateNaturalVariation(color, index, safeColors.length);
                const seed = `${color}-${index}-scribble`;

                const cacheKey: PatternCacheKey = {
                    type: 'scribble',
                    color,
                    direction: variation.direction,
                    density: variation.density,
                    width: 150,
                    height: 150,
                    seed,
                    variation: `${variation.strokeVariation.toFixed(2)}-${variation.opacityVariation.toFixed(2)}`
                };

                return this.getCachedPattern(cacheKey, defs, () => {
                    return this.createEnhancedDirectionalScribblePattern(
                        defs,
                        `scribble-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        color,
                        variation.density,
                        150,
                        150,
                        variation.direction,
                        variation.strokeVariation,
                        variation.opacityVariation,
                        seed
                    );
                });
            } catch (error) {
                console.warn(`Failed to create scribble pattern for color ${color}, creating fallback:`, error);
                // Create a simple fallback pattern that always works
                return this.createFallbackScribblePattern(defs, color, index);
            }
        });
    }

    // Create a guaranteed fallback pattern that always works
    private static createFallbackScribblePattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        color: string,
        index: number
    ): string {
        const patternId = `fallback-scribble-${index}-${Date.now()}`;
        
        const pattern = defs.append('pattern')
            .attr('id', patternId)
            .attr('width', 150)
            .attr('height', 150)
            .attr('patternUnits', 'userSpaceOnUse');

        // Simple but effective scribble pattern
        const pencilColor = this.toPencilColor(color, 0.8);
        
        // Base layer
        pattern.append('rect')
            .attr('width', 150)
            .attr('height', 150)
            .attr('fill', pencilColor)
            .attr('fill-opacity', 0.3);

        // Simple diagonal lines
        const angle = (index * 45) % 180; // Different angle per index
        const group = pattern.append('g')
            .attr('transform', `rotate(${angle}, 75, 75)`);

        for (let i = 0; i < 20; i++) {
            const x = -75 + i * 7.5;
            group.append('line')
                .attr('x1', x)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', 150)
                .attr('stroke', color)
                .attr('stroke-width', 1 + Math.random() * 0.5)
                .attr('stroke-opacity', 0.6 + Math.random() * 0.4)
                .attr('stroke-linecap', 'round');
        }

        return `url(#${patternId})`;
    }

    // Enhanced scribble pattern with natural variations
    private static createEnhancedDirectionalScribblePattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string,
        density: number,
        width: number,
        height: number,
        angle: number,
        strokeVariation: number,
        opacityVariation: number,
        seed: string
    ): string {
        const rng = this.seededRandom(seed);
        
        // Create simple paper texture filter (optimized)
        const filterId = `paper-texture-${id}`;
        defs.select(`#${filterId}`).remove();

        const filter = defs.append("filter")
            .attr("id", filterId)
            .attr("x", "-10%")
            .attr("y", "-10%")
            .attr("width", "120%")
            .attr("height", "120%");

        // Simplified paper texture for better performance
        filter.append('feTurbulence')
            .attr('type', 'fractalNoise')
            .attr("baseFrequency", 0.4) // Fixed frequency for caching
            .attr("numOctaves", 2) // Reduced octaves for performance
            .attr("result", "noise");

        filter.append('feColorMatrix')
            .attr('in', 'noise')
            .attr('type', 'saturate')
            .attr('values', '0'); // Convert to grayscale for paper effect

        const pattern = defs
            .append("pattern")
            .attr("id", id)
            .attr("width", width)
            .attr("height", height)
            .attr("patternUnits", "userSpaceOnUse");

        // Create pencil-like base color layer
        const baseColor = this.toPencilColor(color, 0.12 + rng() * 0.08);
        pattern.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", baseColor)
            .attr("fill-opacity", 1); // Full opacity for base

        // Create organic pastel blobs with natural edges (no squares)
        const blobCount = 3 + Math.floor(rng() * 2); // 3-4 organic blobs
        for (let i = 0; i < blobCount; i++) {
            const pastelColor = this.toPastelColor(color, 0.8 + rng() * 0.2);
            
            // Position blobs to cover different areas
            const cx = width * (0.2 + i * 0.3 + rng() * 0.3); // Distributed placement
            const cy = height * (0.3 + rng() * 0.4);
            const radius = Math.min(width, height) * (0.3 + rng() * 0.4); // Natural size variation
            
            const blobPath = this.createEnhancedOrganicBlob(cx, cy, radius, radius * 0.8, rng);
            
            pattern.append('path')
                .attr('d', blobPath)
                .attr('fill', pastelColor)
                .attr('fill-opacity', 0.15 + rng() * 0.1) // Subtle background blobs
                .attr('stroke', 'none');
        }

        // Add optimized watercolor texture
        const watercolorBlobCount = 4 + Math.floor(rng() * 3); // 4-6 blobs for performance
        this.addEnhancedWatercolorTexture(pattern, width, height, color, watercolorBlobCount, rng);

        // Create multi-directional scribble lines for better coverage
        const group = pattern
            .append("g")
            .attr("transform", `rotate(${angle}, ${width / 2}, ${height / 2})`);

        const spacing = width / (density * 1.5); // Tighter spacing for better coverage
        const lineCount = Math.floor(width * 3 / spacing); // More lines
        
        // Primary scribble lines - ensure complete coverage
        for (let i = 0; i < lineCount; i++) {
            const x = -width * 0.5 + i * spacing + (rng() - 0.5) * spacing * 0.15; // Less jitter for coverage
            
            // Always cover full height but with natural start/end variation
            const startY = -height * 0.05 + (rng() - 0.5) * 10; // Small natural variation at start
            const endY = height * 1.05 + (rng() - 0.5) * 10; // Small natural variation at end
            
            const path = this.generateNaturalScribbleLine(x, startY, x, endY, rng);
            
            const strokeWidth = strokeVariation * (1.0 + rng() * 0.6); // 0.5-1.6 range
            const opacity = Math.max(0.6, opacityVariation * (0.8 + rng() * 0.2)); // 0.6-1.0 range
            
            group
                .append("path")
                .attr("d", path)
                .attr("stroke", color)
                .attr("stroke-width", strokeWidth)
                .attr("stroke-opacity", opacity)
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round");
        }

        // Add cross-hatching for texture depth
        const crossGroup = pattern
            .append("g")
            .attr("transform", `rotate(${angle + 45 + (rng() - 0.5) * 15}, ${width / 2}, ${height / 2})`);

        const crossLineCount = Math.floor(lineCount * 0.4); // Reduced for better performance
        const crossSpacing = spacing * 2.5;

        for (let i = 0; i < crossLineCount; i++) {
            const x = -width * 0.4 + i * crossSpacing;
            
            // Cross-hatch also covers full area but with subtle variation
            const startY = -height * 0.03 + (rng() - 0.5) * 8;
            const endY = height * 1.03 + (rng() - 0.5) * 8;
            
            const path = this.generateNaturalScribbleLine(x, startY, x, endY, rng);
            
            const strokeWidth = strokeVariation * (0.6 + rng() * 0.4); // Thinner cross-hatch
            const opacity = Math.max(0.3, opacityVariation * (0.4 + rng() * 0.3)); // 0.3-0.7 range
            
            crossGroup
                .append("path")
                .attr("d", path)
                .attr("stroke", color)
                .attr("stroke-width", strokeWidth)
                .attr("stroke-opacity", opacity)
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round");
        }

        this.ensureWatercolorBlurFilter(defs);
        return `url(#${id})`;
    }

    // Creates an oil paint pattern with multiple layers of watercolor blobs.
    // Each layer has different sizes and opacities to simulate the texture of oil paint.
    static createOilPaintPattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string
    ): string {
        const patternId = id || `oil-paint-${Math.random().toString(36).substr(2, 9)}`;

        const pattern = defs.append('pattern')
            .attr('id', patternId)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 120)
            .attr('height', 120);

        pattern.append('rect')
            .attr('width', 120)
            .attr('height', 120)
            .attr('fill', color)
            .attr('fill-opacity', 0.4);

        // First layer - large watercolor blobs
        for (let i = 0; i < 6; i++) {
            const colorShift = Math.random() < 0.5 ? -20 : 15;
            const saturationShift = Math.random() < 0.3 ? -0.15 : 0.1;
            const blobColor = this.adjustColor(color, colorShift, saturationShift);

            const cx = Math.random() * 120;
            const cy = Math.random() * 120;
            const rx = 25 + Math.random() * 50;
            const ry = 20 + Math.random() * 40;

            pattern.append('path')
                .attr('d', this.createWatercolorBlob(cx, cy, rx, ry))
                .attr('fill', blobColor)
                .attr('fill-opacity', 0.2 + Math.random() * 0.3)
                .attr('stroke', 'none');
        }

        // Second layer - medium watercolor blobs
        for (let i = 0; i < 8; i++) {
            const isHighlight = Math.random() < 0.3;
            const colorShift = isHighlight ? 25 : -15;
            const blobColor = this.adjustColor(color, colorShift, isHighlight ? 0.1 : -0.1);

            const cx = Math.random() * 120;
            const cy = Math.random() * 120;
            const rx = 10 + Math.random() * 30;
            const ry = 8 + Math.random() * 25;

            pattern.append('path')
                .attr('d', this.createWatercolorBlob(cx, cy, rx, ry))
                .attr('fill', blobColor)
                .attr('fill-opacity', 0.15 + Math.random() * 0.25)
                .attr('stroke', 'none');
        }

        // Third layer - small details
        for (let i = 0; i < 12; i++) {
            const isHighlight = Math.random() < 0.4;
            const colorShift = isHighlight ? 35 : -25;
            const blobColor = this.adjustColor(color, colorShift, isHighlight ? 0.15 : -0.1);

            const cx = Math.random() * 120;
            const cy = Math.random() * 120;
            const rx = 4 + Math.random() * 12;
            const ry = 3 + Math.random() * 10;

            pattern.append('path')
                .attr('d', this.createWatercolorBlob(cx, cy, rx, ry))
                .attr('fill', blobColor)
                .attr('fill-opacity', isHighlight ? (0.2 + Math.random() * 0.3) : (0.1 + Math.random() * 0.2))
                .attr('stroke', 'none');
        }

        return `url(#${patternId})`;
    }

    // Main method to create a set of oil paint patterns with different colors.
    // Each pattern simulates the texture of oil paint with multiple layers of watercolor blobs.
    static createOilPaintPatternSet(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        colors: string[]
    ): string[] {
        return colors.map((color, index) => {
            const seed = `${color}-${index}-oil`;
            const variation = this.generateNaturalVariation(color, index, colors.length);
            
            const cacheKey: PatternCacheKey = {
                type: 'oilpaint',
                color,
                width: 120,
                height: 120,
                seed,
                variation: `texture-${variation.density}`
            };

            return this.getCachedPattern(cacheKey, defs, () => {
                return this.createEnhancedOilPaintPattern(
                    defs, 
                    `oil-paint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
                    color,
                    seed,
                    variation.density
                );
            });
        });
    }

    // Enhanced oil paint pattern with natural texture variations
    private static createEnhancedOilPaintPattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string,
        seed: string,
        textureComplexity: number = 12
    ): string {
        const rng = this.seededRandom(seed);
        const patternId = id || `oil-paint-${Math.random().toString(36).substr(2, 9)}`;

        const pattern = defs.append('pattern')
            .attr('id', patternId)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 120)
            .attr('height', 120);

        // Base layer with varied opacity
        pattern.append('rect')
            .attr('width', 120)
            .attr('height', 120)
            .attr('fill', color)
            .attr('fill-opacity', 0.3 + rng() * 0.2); // 0.3-0.5 base opacity

        // Create multiple layers based on texture complexity
        const layerCount = Math.max(3, Math.floor(textureComplexity / 4));
        
        for (let layer = 0; layer < layerCount; layer++) {
            const layerSeed = `${seed}-layer-${layer}`;
            const layerRng = this.seededRandom(layerSeed);
            
            // Vary blob count per layer
            const blobCounts = [8, 6, 4]; // Decreasing blob count for each layer
            const blobCount = blobCounts[Math.min(layer, blobCounts.length - 1)] + 
                             Math.floor(layerRng() * 3); // Add some variation

            this.createOilPaintLayer(
                pattern, 
                color, 
                layer, 
                blobCount, 
                layerRng
            );
        }

        // Add subtle texture overlay
        this.addTextureOverlay(pattern, color, rng);

        return `url(#${patternId})`;
    }

    // Create individual oil paint layer with natural variations
    private static createOilPaintLayer(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        baseColor: string,
        layerIndex: number,
        blobCount: number,
        rng: () => number
    ): void {
        // Layer-specific characteristics
        const layerTypes = [
            { size: [30, 60], opacity: [0.2, 0.4], colorShift: [-15, 25] },    // Large base shapes
            { size: [15, 35], opacity: [0.15, 0.35], colorShift: [-20, 30] },  // Medium details
            { size: [5, 15], opacity: [0.1, 0.25], colorShift: [-10, 35] }     // Small highlights
        ];
        
        const layerType = layerTypes[Math.min(layerIndex, layerTypes.length - 1)];
        
        for (let i = 0; i < blobCount; i++) {
            // Natural clustering - some areas more dense
            const clusterSeed = Math.floor(rng() * 3); // 0, 1, or 2
            const clusterCenters: [number, number][] = [[30, 30], [90, 60], [60, 90]];
            const clusterCenter = clusterCenters[clusterSeed] || [60, 60]; // Fallback center
            const [clusterX, clusterY] = clusterCenter;
            
            // Position with clustering tendency
            const spreadRadius = 25 + rng() * 35; // Varied spread
            const angle = rng() * Math.PI * 2;
            const distance = rng() * spreadRadius;
            
            const cx = clusterX + Math.cos(angle) * distance + (rng() - 0.5) * 20;
            const cy = clusterY + Math.sin(angle) * distance + (rng() - 0.5) * 20;
            
            // Natural size variation within layer bounds
            const [minSize, maxSize] = layerType.size;
            const rx = minSize + rng() * (maxSize - minSize);
            const ry = minSize * 0.8 + rng() * (maxSize - minSize) * 0.9; // Slightly different aspect
            
            // Color variation
            const [minShift, maxShift] = layerType.colorShift;
            const colorShift = minShift + rng() * (maxShift - minShift);
            const isHighlight = rng() < 0.3; // 30% chance of highlights
            const finalColorShift = isHighlight ? Math.abs(colorShift) : colorShift;
            
            const blobColor = this.adjustColor(baseColor, finalColorShift, isHighlight ? 0.1 : -0.1);
            
            // Opacity variation within layer bounds
            const [minOpacity, maxOpacity] = layerType.opacity;
            const opacity = minOpacity + rng() * (maxOpacity - minOpacity);
            
            // Create natural blob shape
            const blobPath = this.createEnhancedOrganicBlob(
                Math.max(0, Math.min(120, cx)), // Clamp to bounds
                Math.max(0, Math.min(120, cy)),
                rx, ry, rng
            );

            pattern.append('path')
                .attr('d', blobPath)
                .attr('fill', blobColor)
                .attr('fill-opacity', opacity)
                .attr('stroke', 'none');
        }
    }

    // Add subtle texture overlay for more authentic feel
    private static addTextureOverlay(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        color: string,
        rng: () => number
    ): void {
        // Add very subtle grain texture
        const grainCount = 15 + Math.floor(rng() * 10);
        
        for (let i = 0; i < grainCount; i++) {
            const cx = rng() * 120;
            const cy = rng() * 120;
            const radius = 0.5 + rng() * 1.5; // Very small grain
            
            pattern.append('circle')
                .attr('cx', cx)
                .attr('cy', cy)
                .attr('r', radius)
                .attr('fill', color)
                .attr('fill-opacity', 0.05 + rng() * 0.05) // Very subtle
                .attr('stroke', 'none');
        }
    }

    // Adds watercolor texture to a pattern by creating multiple blobs with varying sizes and colors.
    private static addWatercolorTexture(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        width: number,
        height: number,
        color: string,
        numBlobs = 5
    ): void {
        for (let i = 0; i < numBlobs; i++) {
            // Randomize color for natural tone variation
            const blobColor = this.adjustColor(
                color,
                -20 + Math.random() * 40,    // hue shift
                0.15 + Math.random() * 0.2    // transparency
            );

            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const rx = 20 + Math.random() * 40;
            const ry = 20 + Math.random() * 40;

            const blobPath = this.createOrganicBlob(cx, cy, rx, ry);

            pattern.append("path")
                .attr("d", blobPath)
                .attr("fill", blobColor)
                .attr("fill-opacity", 0.12 + Math.random() * 0.15)
                .attr("stroke", "none")
                .attr("filter", "url(#watercolor-soft-blur)");
        }
    }

    // Helps ensure the watercolor blur filter is created only once in the SVG defs.
    private static ensureWatercolorBlurFilter(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>
    ): void {
        if (!defs.select("#watercolor-soft-blur").empty()) return;

        const filter = defs.append("filter")
            .attr("id", "watercolor-soft-blur");

        filter.append("feGaussianBlur")
            .attr("in", "SourceGraphic")
            .attr("stdDeviation", 4);
    }

    // Creates a naturally shaped organic blob to simulate a watercolor effects
    private static createOrganicBlob(cx: number, cy: number, rx: number, ry: number): string {
        const points = 8;
        const angleStep = (Math.PI * 2) / points;
        const path: [number, number][] = [];

        for (let i = 0; i < points; i++) {
            const angle = i * angleStep;
            const rXVar = rx * (0.85 + Math.random() * 0.3);
            const rYVar = ry * (0.85 + Math.random() * 0.3);
            const x = cx + Math.cos(angle) * rXVar;
            const y = cy + Math.sin(angle) * rYVar;
            path.push([x, y]);
        }

        let d = `M ${path[0][0]} ${path[0][1]}`;
        for (let i = 1; i < path.length; i++) {
            const [x, y] = path[i];
            d += ` Q ${path[i - 1][0]} ${path[i - 1][1]} ${x} ${y}`;
        }
        d += " Z";

        return d;
    }

    // Creates a watercolor blob path string based on the center coordinates and radiuses
    private static createWatercolorBlob(cx: number, cy: number, rx: number, ry: number): string {
        const numPoints = 12;
        const points: Array<[number, number]> = [];

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const radiusVariation = 0.7 + Math.random() * 0.6;
            const x = cx + Math.cos(angle) * rx * radiusVariation;
            const y = cy + Math.sin(angle) * ry * radiusVariation;
            points.push([x, y]);
        }

        points.push(points[0]);

        const lineGenerator = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasisClosed);

        return lineGenerator(points) || '';
    }

    // Adjusts the color by changing its brightness and saturation to simulate a hand-drawn effect.
    private static adjustColor(color: string, brightnessDelta = 0, saturationDelta = 0): string {
        const tempElement = document.createElement('div');
        tempElement.style.color = color;
        document.body.appendChild(tempElement);

        const computedColor = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);

        const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!rgbMatch) {
            return color;
        }

        let r = parseInt(rgbMatch[1], 10) / 255;
        let g = parseInt(rgbMatch[2], 10) / 255;
        let b = parseInt(rgbMatch[3], 10) / 255;

        // Convert RGB to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h: number, s: number;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: h = 0;
            }

            h /= 6;
        }

        // Adjust saturation and lightness
        s = Math.max(0, Math.min(1, s + saturationDelta));
        const adjustedL = Math.max(0, Math.min(1, l + brightnessDelta / 100));

        // Convert back to RGB
        let r1: number, g1: number, b1: number;

        if (s === 0) {
            r1 = g1 = b1 = adjustedL; // achromatic
        } else {
            const hue2rgb = (p: number, q: number, t: number): number => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s;
            const p = 2 * adjustedL - q;

            r1 = hue2rgb(p, q, h + 1 / 3);
            g1 = hue2rgb(p, q, h);
            b1 = hue2rgb(p, q, h - 1 / 3);
        }

        r = Math.round(r1 * 255);
        g = Math.round(g1 * 255);
        b = Math.round(b1 * 255);

        return `rgb(${r}, ${g}, ${b})`;
    }
}