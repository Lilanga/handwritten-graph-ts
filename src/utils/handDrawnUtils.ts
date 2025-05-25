import * as d3 from 'd3';

// Provides utility functions to create hand-drawn style SVG paths.
// Here we create utilities for adding jitter to existing paths, creating hand-drawn rectangles, and circles.
export class HandDrawnUtils {
    // Adds a hand-drawn effect to an existing SVG path string by introducing random jitter.
    static addHandDrawnEffect(pathString: string, jitterAmount = 2, numPoints = 100): string {
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathString);
        tempSvg.appendChild(path);
        document.body.appendChild(tempSvg);

        const length = path.getTotalLength();
        const handDrawnPoints: Array<{ x: number; y: number }> = [];

        for (let i = 0; i <= numPoints; i++) {
            const point = path.getPointAtLength(length * i / numPoints);
            point.x += (Math.random() - 0.5) * jitterAmount;
            point.y += (Math.random() - 0.5) * jitterAmount;
            handDrawnPoints.push(point);
        }

        document.body.removeChild(tempSvg);

        const handDrawnLine = d3.line<{ x: number; y: number }>()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveBasis);

        return handDrawnLine(handDrawnPoints) || '';
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