import * as d3 from 'd3';

// This module provides utility functions to create various types of scribble patterns
// and oil paint patterns for SVG graphics, simulating hand-drawn effects.
export class ScribbleFillUtils {
    static createDirectionalScribblePattern(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string,
        density = 8,
        width = 120,
        height = 120,
        direction = 0
    ): string {
        const patternId = id || `scribble-${Math.random().toString(36).substr(2, 9)}`;

        const pattern = defs.append('pattern')
            .attr('id', patternId)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', width)
            .attr('height', height);

        pattern.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', color)
            .attr('fill-opacity', 0.25);

        this.addWatercolorTexture(pattern, width, height, color, 4);

        const angleRad = (direction * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const diagonalLength = Math.sqrt(width * width + height * height);
        const center: [number, number] = [width / 2, height / 2];
        const lineSpacing = height / (density + 1);

        for (let i = 0; i <= density; i++) {
            const offset = i * lineSpacing - height / 2;
            const startX = center[0] - cos * diagonalLength / 2 + sin * offset;
            const startY = center[1] - sin * diagonalLength / 2 - cos * offset;
            const endX = center[0] + cos * diagonalLength / 2 + sin * offset;
            const endY = center[1] + sin * diagonalLength / 2 - cos * offset;

            const path = this.generateScribblePath([startX, startY], [endX, endY]);
            const strokeOpacity = 0.5 + Math.random() * 0.3;
            const strokeWidth = 1 + Math.random() * 2;
            const strokeColor = this.adjustColor(color, -15 + Math.random() * 30);

            pattern.append('path')
                .attr('d', path)
                .attr('stroke', strokeColor)
                .attr('stroke-width', strokeWidth)
                .attr('stroke-linecap', 'round')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-opacity', strokeOpacity)
                .attr('fill', 'none');
        }

        return `url(#${patternId})`;
    }

    // Creates a set of scribble patterns with different colors and directions.
    // The patterns are designed to simulate a hand-drawn effect with varying densities and angles.
    static createScribblePatternSet(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        colors: string[]
    ): string[] {
        const directions = [0, 45, 90, 135, 30, 60, 120, 150];

        return colors.map((color, index) => {
            const direction = directions[index % directions.length];
            const density = 6 + Math.floor(Math.random() * 5);

            return this.createDirectionalScribblePattern(
                defs,
                `scribble-pattern-${index}`,
                color,
                density,
                120,
                120,
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

    // Creates a set of oil paint patterns with different colors.
    // Each pattern simulates the texture of oil paint with multiple layers of watercolor blobs.
    static createOilPaintPatternSet(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        colors: string[]
    ): string[] {
        return colors.map((color, index) => {
            return this.createOilPaintPattern(defs, `oil-paint-${index}`, color);
        });
    }

    // Generates a scribble path between two points with a hand-drawn effect.
    // The path consists of multiple points that create a wobbly line effect.
    private static generateScribblePath(
        start: [number, number],
        end: [number, number]
    ): string {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const numPoints = Math.max(10, Math.min(30, Math.floor(length / 10)));
        const points: Array<[number, number]> = [];
        const wobbleAmount = 2 + Math.random() * 2;
        const perpX = -dy / length;
        const perpY = dx / length;

        points.push(start);

        for (let i = 1; i < numPoints; i++) {
            const t = i / numPoints;
            const baseX = start[0] + dx * t;
            const baseY = start[1] + dy * t;
            const wobble = (Math.random() - 0.5) * wobbleAmount;
            const speedWobble = (Math.random() - 0.5) * wobbleAmount * 0.3;

            const pointX = baseX + perpX * wobble + (dx / length) * speedWobble;
            const pointY = baseY + perpY * wobble + (dy / length) * speedWobble;

            points.push([pointX, pointY]);
        }

        points.push(end);

        const pathGenerator = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasis);

        return pathGenerator(points) || '';
    }

    // Adds watercolor texture to a pattern by creating multiple blobs with varying sizes and colors.
    private static addWatercolorTexture(
        pattern: d3.Selection<SVGPatternElement, unknown, null, undefined>,
        width: number,
        height: number,
        color: string,
        numBlobs = 3
    ): void {
        for (let i = 0; i < numBlobs; i++) {
            const blobColor = this.adjustColor(color, -20 + Math.random() * 40, 0.1 + Math.random() * 0.2);
            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const rx = 15 + Math.random() * 30;
            const ry = 15 + Math.random() * 30;

            const blobPath = this.createWatercolorBlob(cx, cy, rx, ry);

            pattern.append('path')
                .attr('d', blobPath)
                .attr('fill', blobColor)
                .attr('fill-opacity', 0.15 + Math.random() * 0.2)
                .attr('stroke', 'none');
        }
    }

    // Creates a watercolor blob path string based on the center coordinates and radiuses.
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