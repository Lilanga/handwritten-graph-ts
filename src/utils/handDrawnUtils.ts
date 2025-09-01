import * as d3 from 'd3';

interface PathPoint {
    x: number;
    y: number;
}

interface PathCache {
    originalPath: string;
    sampledPoints: PathPoint[];
    length: number;
}

// Provides utility functions to create hand-drawn style SVG paths.
// Here we create utilities for adding jitter to existing paths, creating hand-drawn rectangles, and circles.
export class HandDrawnUtils {
    private static pathCache = new Map<string, PathCache>();
    private static tempSvg: SVGSVGElement | null = null;
    private static tempPath: SVGPathElement | null = null;

    // Initialize reusable DOM elements once
    private static initializeTempElements(): void {
        if (!this.tempSvg) {
            this.tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this.tempSvg.appendChild(this.tempPath);
            this.tempSvg.style.position = 'absolute';
            this.tempSvg.style.visibility = 'hidden';
            this.tempSvg.style.pointerEvents = 'none';
            document.body.appendChild(this.tempSvg);
        }
    }

    // Clean up temporary elements when no longer needed
    private static cleanupTempElements(): void {
        if (this.tempSvg && document.body.contains(this.tempSvg)) {
            document.body.removeChild(this.tempSvg);
            this.tempSvg = null;
            this.tempPath = null;
        }
    }

    // Sample points from a path using cached results when possible
    private static samplePathPoints(pathString: string, numPoints: number): PathPoint[] {
        const cacheKey = `${pathString}_${numPoints}`;
        
        if (this.pathCache.has(cacheKey)) {
            return this.pathCache.get(cacheKey)!.sampledPoints;
        }

        this.initializeTempElements();
        
        if (!this.tempPath) {
            throw new Error('Failed to initialize temporary path element');
        }

        this.tempPath.setAttribute('d', pathString);
        const length = this.tempPath.getTotalLength();
        const points: PathPoint[] = [];

        for (let i = 0; i <= numPoints; i++) {
            const point = this.tempPath.getPointAtLength(length * i / numPoints);
            points.push({ x: point.x, y: point.y });
        }

        // Cache the results for future use
        this.pathCache.set(cacheKey, {
            originalPath: pathString,
            sampledPoints: points,
            length: length
        });

        // Limit cache size to prevent memory leaks
        if (this.pathCache.size > 100) {
            const firstKey = this.pathCache.keys().next().value;
            if (firstKey) {
                this.pathCache.delete(firstKey);
            }
        }

        return points;
    }

    // Adds a hand-drawn effect to an existing SVG path string by introducing random jitter.
    static addHandDrawnEffect(pathString: string, jitterAmount = 2, numPoints = 100): string {
        try {
            const basePoints = this.samplePathPoints(pathString, numPoints);
            const handDrawnPoints: PathPoint[] = basePoints.map(point => ({
                x: point.x + (Math.random() - 0.5) * jitterAmount,
                y: point.y + (Math.random() - 0.5) * jitterAmount
            }));

            const handDrawnLine = d3.line<PathPoint>()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveBasis);

            return handDrawnLine(handDrawnPoints) || '';
        } catch (error) {
            console.warn('Failed to apply hand-drawn effect, returning original path:', error);
            return pathString;
        }
    }

    // Clear the path cache manually if needed
    static clearPathCache(): void {
        this.pathCache.clear();
        this.cleanupTempElements();
    }

    // Creates a hand-drawn rectangle path string with optional jitter.
    static createHandDrawnRect(x: number, y: number, width: number, height: number, jitter = 2): string {
        const topLeft = { x, y };
        const topRight = { x: x + width, y };
        const bottomRight = { x: x + width, y: y + height };
        const bottomLeft = { x, y: y + height };

        const numPoints = 20;
        const points: Array<[number, number]> = [];

        // Top edge
        for (let i = 0; i <= numPoints; i++) {
            const point: [number, number] = [
                topLeft.x + (topRight.x - topLeft.x) * (i / numPoints),
                topLeft.y + (Math.random() - 0.5) * jitter
            ];
            points.push(point);
        }

        // Right edge
        for (let i = 0; i <= numPoints; i++) {
            const point: [number, number] = [
                topRight.x + (Math.random() - 0.5) * jitter,
                topRight.y + (bottomRight.y - topRight.y) * (i / numPoints)
            ];
            points.push(point);
        }

        // Bottom edge
        for (let i = 0; i <= numPoints; i++) {
            const point: [number, number] = [
                bottomRight.x - (bottomRight.x - bottomLeft.x) * (i / numPoints),
                bottomRight.y + (Math.random() - 0.5) * jitter
            ];
            points.push(point);
        }

        // Left edge
        for (let i = 0; i <= numPoints; i++) {
            const point: [number, number] = [
                bottomLeft.x + (Math.random() - 0.5) * jitter,
                bottomLeft.y - (bottomLeft.y - topLeft.y) * (i / numPoints)
            ];
            points.push(point);
        }

        points.push(points[0]);

        const pathGenerator = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasisClosed);

        return pathGenerator(points) || '';
    }

    // Creates a hand-drawn circle path string with optional jitter.
    static createHandDrawnCircle(cx: number, cy: number, radius: number, jitter = 2): string {
        const numPoints = 40;
        const points: Array<[number, number]> = [];

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const jitterAmount = (Math.random() - 0.5) * jitter;
            const adjustedRadius = radius + jitterAmount;

            const point: [number, number] = [
                cx + Math.cos(angle) * adjustedRadius,
                cy + Math.sin(angle) * adjustedRadius
            ];

            points.push(point);
        }

        points.push(points[0]);

        const pathGenerator = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasisClosed);

        return pathGenerator(points) || '';
    }
}