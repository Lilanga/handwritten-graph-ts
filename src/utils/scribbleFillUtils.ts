import * as d3 from 'd3';

// Utility calss for creating hand-drawn style fills using D3.js.
// Directional scribble patterns and oil paint textures are generated with customizable parameters.
export class ScribbleFillUtils {
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

    // Converts a base color to a pastel color with slight variations in hue, saturation, and lightness.
    static toPastelColor(baseColor: string, alpha: number = 0.12): string {
        const d3Color = d3.color(baseColor);
        if (d3Color) {
            const hsl = d3.hsl(d3Color);
            const hueJitter = (Math.random() - 0.5) * 6;
            const satJitter = (Math.random() - 0.5) * 0.1;
            const lightJitter = (Math.random() - 0.5) * 0.1;

            hsl.h += hueJitter;
            hsl.s = Math.max(0.3, Math.min(0.6, hsl.s * 0.5 + satJitter));
            hsl.l = Math.max(0.75, Math.min(0.9, hsl.l * 1.2 + lightJitter));

            return `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${alpha})`;
        }

        return `rgba(230, 230, 230, ${alpha})`;
    }

    // Main method to create a set of scribble patterns with different colors and directions.
    // The patterns are designed to simulate a hand-drawn effect with varying densities and angles.
    static createScribblePatternSet(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        colors: string[]
    ): string[] {
        const directions = [0, 45, 90, 135, 30, 60, 120, 150];

        return colors.map((color, index) => {
            const direction = directions[index % directions.length];
            const density = 10 + Math.floor(Math.random() * 4);

            return this.createDirectionalScribblePattern(
                defs,
                `scribble-pattern-${index}`,
                color,
                density,
                150,
                150,
                direction
            );
        });
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
            return this.createOilPaintPattern(defs, `oil-paint-${index}`, color);
        });
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