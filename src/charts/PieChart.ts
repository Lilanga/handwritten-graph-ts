import * as d3 from 'd3';
import { BaseChart } from '../core/BaseChart';
import { PieChartData, PieChartConfig, TooltipItem } from '../types';
import { Tooltip } from '../components/Tooltip';
import { HandDrawnUtils } from '../utils/handDrawnUtils';
import { ScribbleFillUtils } from '../utils/scribbleFillUtils';

// Default configuration settings for PieChart
const DEFAULT_PIE_CONFIG: Required<PieChartConfig> = {
    width: 600,
    height: 400,
    margin: { top: 20, right: 150, bottom: 20, left: 20 },
    innerRadius: 0,
    padAngle: 0.02,
    cornerRadius: 3,
    fontFamily: 'xkcd',
    handDrawnEffect: true,
    handDrawnJitter: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    tooltipBgColor: '#fff',
    tooltipTextColor: '#333',
    tooltipBorderColor: '#333',
    tooltipBorderWidth: 2,
    tooltipBorderRadius: 5,
    tooltipOpacity: 0.9,
    legendBorder: true,
    valueFormat: (d: number) => d3.format('.1f')(d),
    useScribbleFill: true,
    fillStyle: 'directional'
};

// PieChart class that extends BaseChart to create a pie chart visualization
export class PieChart extends BaseChart<PieChartData, PieChartConfig> {
    private radius: number;
    private pie: d3.Pie<unknown, PieChartData[0]> | null = null;
    private arc: d3.Arc<unknown, d3.PieArcDatum<PieChartData[0]>> | null = null;
    private tooltip: Tooltip | null = null;
    private processedData: PieChartData = [];
    private total: number = 0;

    // Here we call the parent constructor with the processed data and default configuration
    constructor(selector: string, data: PieChartData, config: Partial<PieChartConfig> = {}) {
        // validate and process the data before passing it to the parent constructor
        const validatedData = PieChart.validateAndProcessData(data);

        super(selector, validatedData, config as PieChartConfig, DEFAULT_PIE_CONFIG);

        this.radius = Math.min(this.width, this.height) / 2;

        // Process the validated data and set up pie components
        this.processedData = this.processData(validatedData);
        this.total = d3.sum(this.processedData, d => d.value) || 0;

        // We can create pie chart only if we have valid data
        if (this.processedData.length > 0) {
            this.initializePieComponents();
        }

        this.renderChart();
    }

    // Static method to validate and process the input data to ensure it meets the requirements for a pie chart
    private static validateAndProcessData(data: PieChartData): PieChartData {
        // Ensure data is valid array
        if (!Array.isArray(data)) {
            console.warn('PieChart data should be an array');
            return [];
        }

        // Filter out invalid data items
        return data.filter(item =>
            item &&
            typeof item === 'object' &&
            typeof item.value === 'number' &&
            !isNaN(item.value) &&
            item.value > 0 &&
            typeof item.label === 'string' &&
            item.label.trim().length > 0
        );
    }

    // Here we process the data to ensure it has the correct structure and defaults
    private processData(data: PieChartData): PieChartData {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Use brighter colors more suitable for oil paint and scribble patterns
        const brightColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
            '#DDA0DD', '#FF7F50', '#87CEEB', '#98D8C8', '#F7DC6F'
        ];
        const color = d3.scaleOrdinal(brightColors);

        return data.map((d, i) => ({
            label: d.label || `Item ${i + 1}`,
            value: d.value,
            color: d.color || color(i.toString())
        }));
    }

    // Initialize pie components like pie layout and arc generator using d3
    private initializePieComponents(): void {
        // Safety check - ensure we have valid processed data
        if (!this.processedData || !Array.isArray(this.processedData) || this.processedData.length === 0) {
            console.warn('Cannot initialize pie components: no valid data');
            return;
        }

        this.pie = d3.pie<PieChartData[0]>()
            .value(d => d.value)
            .padAngle(this.config.padAngle)
            .sort(null);

        this.arc = d3.arc<d3.PieArcDatum<PieChartData[0]>>()
            .innerRadius(this.config.innerRadius)
            .outerRadius(this.radius)
            .cornerRadius(this.config.cornerRadius);
    }

    protected render(): void {
        // Check if we're ready to render
        if (!this.isReady()) {
            console.error('PieChart not ready for rendering');
            return;
        }

        // Check if we have valid data
        if (!this.processedData || this.processedData.length === 0 || this.total === 0) {
            this.renderEmptyState();
            return;
        }

        // Ensure components are initialized (they should be from constructor, but double-check)
        if (!this.pie || !this.arc) {
            this.initializePieComponents();

            // If still not initialized, we have a problem
            if (!this.pie || !this.arc) {
                console.error('Pie components could not be initialized');
                this.renderEmptyState();
                return;
            }
        }

        this.createXkcdFilter();

        // Center the chart
        if (this.svg) {
            this.svg.attr('transform', `translate(${this.config.width / 2 - this.margin.right / 2 + this.margin.left / 2}, ${this.config.height / 2})`);
        }

        const fillPatterns = this.createFillPatterns();
        this.renderArcs(fillPatterns);
        this.renderLegend(fillPatterns);
        this.setupInteractions();
    }

    // Render an empty state when there is no data to display
    private renderEmptyState(): void {
        if (this.svg) {
            // Reset transform for empty state
            this.svg.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

            this.svg.append('text')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .style('font-family', this.config.fontFamily)
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('No data to display');
        }
    }

    // Create fill patterns based on the configuration and processed data
    private createFillPatterns(): string[] {
        // Enable pattern creation for scribble fills OR when oil paint is explicitly requested
        const shouldCreatePatterns = this.config.useScribbleFill || this.config.fillStyle === 'oilpaint';
        
        if (!shouldCreatePatterns || !this.processedData || this.processedData.length === 0 || !this.defs) {
            return [];
        }

        // Filter out undefined colors and ensure we have valid color strings
        const colors = this.processedData
            .map(d => d.color)
            .filter((color): color is string => typeof color === 'string' && color.length > 0);

        if (colors.length === 0) {
            console.warn('No valid colors found for fill patterns');
            return [];
        }

        try {
            if (this.config.fillStyle === 'oilpaint') {
                return ScribbleFillUtils.createOilPaintPatternSet(this.defs, colors);
            } else {
                return ScribbleFillUtils.createScribblePatternSet(this.defs, colors);
            }
        } catch (error) {
            console.warn('Error creating fill patterns:', error);
            return [];
        }
    }

    // Render the pie chart arcs with the fill patterns
    private renderArcs(fillPatterns: string[]): void {
        if (!this.pie || !this.arc || !this.svg || !this.processedData || this.processedData.length === 0) {
            return;
        }

        const arcs = this.svg.selectAll('.arc')
            .data(this.pie(this.processedData))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', d => {
                if (this.config.handDrawnEffect) {
                    return this.handDrawnArc(d);
                } else {
                    return this.arc!(d);
                }
            })
            .attr('fill', (d, i) => {
                if (this.config.useScribbleFill || this.config.fillStyle === 'oilpaint') {
                    if (fillPatterns.length > 0) {
                        return fillPatterns[i % fillPatterns.length];
                    } else {
                        // Emergency pattern creation for individual slices
                        const sliceColor = d.data.color || '#666';
                        try {
                            const emergencyPatterns = this.config.fillStyle === 'oilpaint' 
                                ? ScribbleFillUtils.createOilPaintPatternSet(this.defs!, [sliceColor])
                                : ScribbleFillUtils.createScribblePatternSet(this.defs!, [sliceColor]);
                            return emergencyPatterns.length > 0 ? emergencyPatterns[0] : sliceColor;
                        } catch (error) {
                            console.warn('Emergency pattern creation failed, using solid color:', error);
                            return sliceColor;
                        }
                    }
                } else {
                    return d.data.color || '#666';
                }
            })
            .attr('stroke', (d, i) => {
                // Use the same fill as the border for seamless appearance
                if (this.config.useScribbleFill || this.config.fillStyle === 'oilpaint') {
                    if (fillPatterns.length > 0) {
                        return fillPatterns[i % fillPatterns.length];
                    } else {
                        // Emergency pattern creation for stroke (same as fill)
                        const sliceColor = d.data.color || '#666';
                        try {
                            const emergencyPatterns = this.config.fillStyle === 'oilpaint' 
                                ? ScribbleFillUtils.createOilPaintPatternSet(this.defs!, [sliceColor])
                                : ScribbleFillUtils.createScribblePatternSet(this.defs!, [sliceColor]);
                            return emergencyPatterns.length > 0 ? emergencyPatterns[0] : sliceColor;
                        } catch (error) {
                            return sliceColor;
                        }
                    }
                } else {
                    return d.data.color || '#666';
                }
            })
            .attr('stroke-width', 1)
            .attr('stroke-linecap', this.config.strokeLinecap)
            .attr('stroke-linejoin', this.config.strokeLinejoin)
            .attr('filter', this.config.handDrawnEffect ? 'url(#xkcdify)' : null);
    }

    // Create a hand-drawn effect for the arcs using a custom method
    private handDrawnArc(d: d3.PieArcDatum<PieChartData[0]>): string {
        if (!this.arc) return '';

        const originalPath = this.arc(d);
        if (!originalPath) return '';

        try {
            const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', originalPath);
            tempSvg.appendChild(path);
            document.body.appendChild(tempSvg);

            const length = path.getTotalLength();
            const numPoints = Math.max(20, Math.floor(length / 5));
            const points: Array<{ x: number; y: number }> = [];

            for (let i = 0; i <= numPoints; i++) {
                const point = path.getPointAtLength(length * i / numPoints);
                point.x += (Math.random() - 0.5) * this.config.handDrawnJitter;
                point.y += (Math.random() - 0.5) * this.config.handDrawnJitter;
                points.push(point);
            }

            document.body.removeChild(tempSvg);

            const handDrawnLine = d3.line<{ x: number; y: number }>()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveBasisClosed);

            return handDrawnLine(points) || '';
        } catch (error) {
            console.warn('Error creating hand-drawn arc:', error);
            return originalPath;
        }
    }

    // Render the legend for the pie chart, showing labels and percentages
    private renderLegend(fillPatterns: string[]): void {
        if (!this.processedData || this.processedData.length === 0 || !this.svg) return;

        const legendGroup = this.svg.append('g').attr('class', 'legend');

        const legendItemHeight = this.processedData.length > 6 ? 16 : 20;
        const legendTotalHeight = this.processedData.length * legendItemHeight + 10;

        const avgCharWidth = 6;
        const maxLabelLength = d3.max(this.processedData, d => d.label.length) || 10;
        const percentageWidth = 40;
        const colorSquareWidth = 25;

        const calculatedWidth = Math.min(
            250,
            Math.max(100, maxLabelLength * avgCharWidth + percentageWidth + colorSquareWidth)
        );

        const legendX = this.radius + 30;
        const legendY = -legendTotalHeight / 2;

        legendGroup.attr('transform', `translate(${legendX}, ${legendY})`);

        if (this.config.legendBorder) {
            const borderPadding = { left: 10, right: 15, top: 8, bottom: 8 };
            const borderWidth = calculatedWidth + borderPadding.left + borderPadding.right;
            const borderHeight = legendTotalHeight + borderPadding.top + borderPadding.bottom;

            legendGroup.append('path')
                .attr('d', HandDrawnUtils.createHandDrawnRect(
                    -borderPadding.left,
                    -borderPadding.top,
                    borderWidth,
                    borderHeight,
                    this.config.handDrawnJitter
                ))
                .attr('fill', this.config.tooltipBgColor)
                .attr('fill-opacity', this.config.tooltipOpacity)
                .attr('stroke', this.config.tooltipBorderColor)
                .attr('stroke-width', this.config.tooltipBorderWidth)
                .attr('filter', this.config.handDrawnEffect ? 'url(#xkcdify)' : null);
        }

        this.processedData.forEach((d, i) => {
            const itemY = i * legendItemHeight;
            const legendEntry = legendGroup.append('g')
                .attr('transform', `translate(0, ${itemY})`);

            legendEntry.append('rect')
                .attr('x', this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
                .attr('y', this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
                .attr('width', 8)
                .attr('height', 8)
                .attr('fill', (this.config.useScribbleFill || this.config.fillStyle === 'oilpaint')
                    ? (fillPatterns.length > 0 
                        ? fillPatterns[i % fillPatterns.length]
                        : (() => {
                            try {
                                const emergencyPatterns = this.config.fillStyle === 'oilpaint' 
                                    ? ScribbleFillUtils.createOilPaintPatternSet(this.defs!, [d.color || '#666'])
                                    : ScribbleFillUtils.createScribblePatternSet(this.defs!, [d.color || '#666']);
                                return emergencyPatterns.length > 0 ? emergencyPatterns[0] : (d.color || '#666');
                            } catch (error) {
                                return d.color || '#666';
                            }
                        })())
                    : (d.color || '#666'))
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('filter', this.config.handDrawnEffect ? 'url(#xkcdify)' : null);

            const maxChars = Math.max(10, Math.min(30, Math.floor((calculatedWidth - 50) / 6)));
            let label = d.label;
            if (label.length > maxChars) {
                label = label.substring(0, maxChars - 3) + '...';
            }

            const percentage = this.total > 0 ? ((d.value / this.total) * 100).toFixed(1) : '0.0';
            const displayText = `${label} (${percentage}%)`;

            const textElement = legendEntry.append('text')
                .attr('x', 15 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .attr('y', 8 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .text(displayText)
                .style('font-family', this.config.fontFamily)
                .style('fill', this.config.tooltipTextColor)
                .attr('alignment-baseline', 'middle');

            const fontSize = this.processedData.length > 6 || calculatedWidth < 120 ? 12 : 14;
            textElement.style('font-size', `${fontSize}px`);
        });
    }

    private setupInteractions(): void {
        if (!this.svg || !this.processedData || this.processedData.length === 0) return;

        this.svg.selectAll('.arc')
            .on('mouseover', (event, d) => this.handleMouseOver(event, d as d3.PieArcDatum<PieChartData[0]>))
            .on('mousemove', (event) => this.handleMouseMove(event))
            .on('mouseout', (event) => this.handleMouseOut(event));
    }

    // Handle mouse over event to show tooltip and apply hover effect
    private handleMouseOver(event: MouseEvent, d: d3.PieArcDatum<PieChartData[0]>): void {
        if (!this.arc) return;

        d3.select(event.target as Element).transition()
            .duration(200)
            .attr('transform', () => {
                const centroid = this.arc!.centroid(d);
                const angle = Math.atan2(centroid[1], centroid[0]);
                const x = Math.cos(angle) * 10;
                const y = Math.sin(angle) * 10;
                return `translate(${x}, ${y})`;
            });

        const percentage = this.total > 0 ? ((d.data.value / this.total) * 100).toFixed(1) : '0.0';
        const dataColor = d.data.color || '#666'; // Provide fallback color

        const tooltipItems: TooltipItem[] = [
            { color: dataColor, text: `Value: ${this.config.valueFormat(d.data.value)}` },
            { color: dataColor, text: `Percentage: ${percentage}%` }
        ];

        if (this.svg) {
            const svgNode = this.svg.node()!;
            const svgRect = svgNode.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - this.config.width / 2;
            const mouseY = event.clientY - svgRect.top - this.config.height / 2;

            if (!this.tooltip) {
                this.tooltip = new Tooltip({
                    parent: this.svg as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
                    title: d.data.label,
                    items: tooltipItems,
                    position: { type: 'auto', x: mouseX, y: mouseY },
                    unxkcdify: !this.config.handDrawnEffect,
                    backgroundColor: this.config.tooltipBgColor,
                    strokeColor: this.config.tooltipBorderColor,
                    fontFamily: this.config.fontFamily,
                    chartWidth: this.config.width,
                    chartHeight: this.config.height
                });
                this.tooltip.show();
            } else {
                this.tooltip.update({
                    title: d.data.label,
                    items: tooltipItems,
                    position: { type: 'auto', x: mouseX, y: mouseY }
                });
                this.tooltip.show();
            }
        }
    }

    // Handle mouse move event to update tooltip position
    private handleMouseMove(event: MouseEvent): void {
        if (this.tooltip && this.svg) {
            const svgNode = this.svg.node()!;
            const svgRect = svgNode.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - this.config.width / 2;
            const mouseY = event.clientY - svgRect.top - this.config.height / 2;

            this.tooltip.update({
                position: { type: 'auto', x: mouseX, y: mouseY }
            });
        }
    }

    // Handle mouse out event to hide tooltip and reset hover effect
    private handleMouseOut(event: MouseEvent): void {
        d3.select(event.target as Element).transition()
            .duration(200)
            .attr('transform', 'translate(0, 0)');

        if (this.tooltip) {
            this.tooltip.hide();
        }
    }

    // Here we override the destroy method to clean up the tooltip and any other resources
    // This ensures that the chart can be properly removed from the DOM without memory leaks
    public destroy(): void {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        super.destroy();
    }
}