import * as d3 from 'd3';
import { BaseChart } from '../core/BaseChart';
import { LineChartData, LineChartConfig, TooltipItem } from '../types';
import { Tooltip } from '../components/Tooltip';
import { HandDrawnUtils } from '../utils/handDrawnUtils';
import { ScribbleFillUtils } from '../utils/scribbleFillUtils';

// Default configuration settings for the LineChart
const DEFAULT_LINE_CONFIG: Required<LineChartConfig> = {
    width: 960,
    height: 500,
    margin: { top: 10, right: 10, bottom: 40, left: 50 },
    lineColor: 'steelblue',
    pointRadius: 4,
    fontFamily: 'xkcd',
    gridColor: '#e0e0e0',
    handDrawnEffect: true,
    handDrawnPoints: 100,
    handDrawnJitter: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    tooltipBgColor: '#fff',
    tooltipTextColor: '#333',
    tooltipBorderColor: '#333',
    tooltipBorderWidth: 2,
    tooltipBorderRadius: 5,
    tooltipOpacity: 0.9,
    legendBorder: false,
    valueFormat: (d: number) => d3.format('.1f')(d),
    showArea: false,
    useScribbleFill: false,
    fillStyle: 'directional'
};

// This is the main class for the LineChart, extending the BaseChart class.
// Here, we define the structure and behavior of the line chart, including data validation, rendering, and interactions.
export class LineChart extends BaseChart<LineChartData, LineChartConfig> {
    private xScale: d3.ScalePoint<string> | null = null;
    private yScale: d3.ScaleLinear<number, number> | null = null;
    private tooltip: Tooltip | null = null;
    private hoverLine: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;

    constructor(selector: string, data: LineChartData, config: Partial<LineChartConfig> = {}) {
        // Process data before calling parent constructor
        const processedData = LineChart.validateAndProcessData(data);

        super(selector, processedData, config as LineChartConfig, DEFAULT_LINE_CONFIG);

        // Initialize scales after parent constructor but before render
        this.initializeScales();
        this.initializeHoverLine();

        // Now that everything is set up, render the chart
        this.renderChart();
    }

    private static validateAndProcessData(data: LineChartData): LineChartData {
        // if data structure is valid
        if (!data || typeof data !== 'object') {
            return { labels: [], datasets: [] };
        }

        // check labels exist and are valid
        let labels = Array.isArray(data.labels) ? data.labels : [];

        // check for datasets exist and are valid
        let datasets = Array.isArray(data.datasets) ? data.datasets : [];

        // Clean up datasets
        datasets = datasets.filter(dataset =>
            dataset &&
            typeof dataset === 'object' &&
            Array.isArray(dataset.data) &&
            dataset.data.length > 0
        );

        // If we have no valid data, create empty state
        if (labels.length === 0 && datasets.length === 0) {
            labels = ['No Data'];
            datasets = [];
        }

        return { labels, datasets };
    }

    // Initialize scales based on processed data
    private initializeScales(): void {
        // Use processed data for scales
        const labels = this.data.labels.length > 0 ? this.data.labels : ['No Data'];

        // Get all valid numeric values from all datasets
        const allValues: number[] = [];
        if (this.data.datasets && this.data.datasets.length > 0) {
            this.data.datasets.forEach(dataset => {
                if (dataset.data && Array.isArray(dataset.data)) {
                    dataset.data.forEach(value => {
                        if (typeof value === 'number' && !isNaN(value)) {
                            allValues.push(value);
                        }
                    });
                }
            });
        }

        // Use default range if no valid values found
        if (allValues.length === 0) {
            allValues.push(0, 10);
        }

        const maxValue = d3.max(allValues) || 10;
        const minValue = d3.min(allValues) || 0;

        // Creating scales using d3
        this.xScale = d3.scalePoint<string>()
            .domain(labels)
            .range([0, this.width])
            .padding(0.1);

        this.yScale = d3.scaleLinear()
            .domain([Math.min(0, minValue), Math.max(maxValue * 1.2, 10)])
            .range([this.height, 0]);
    }

    // Initialize the hover line for interactions
    private initializeHoverLine(): void {
        if (this.svg) {
            this.hoverLine = ((this.svg as unknown) as d3.Selection<SVGSVGElement, unknown, null, undefined>).append('line')
                .attr('class', 'hover-line')
                .style('opacity', 0);
        }
    }

    // Render the chart components
    // This method is called after the scales are initialized and the data is processed.
    protected render(): void {
        // Ensure scales are initialized before rendering
        if (!this.xScale || !this.yScale) {
            this.initializeScales();
        }

        // Check if we're ready to render
        if (!this.isReady() || !this.xScale || !this.yScale) {
            console.error('LineChart not ready for rendering');
            return;
        }

        // Only render if we have valid data
        if (!this.data.datasets || this.data.datasets.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.createXkcdFilter();
        this.renderGrid();
        this.renderAxes();

        // Create fill patterns if scribble fill is enabled
        const fillPatterns = this.createFillPatterns();

        // Render area if enabled
        if (this.config.showArea) {
            this.renderAreas(fillPatterns);
        }

        this.renderLines();
        this.renderPoints(fillPatterns);
        this.renderLegend(fillPatterns);
        this.setupInteractions();
    }

    private renderEmptyState(): void {
        if (this.svg) {
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
        if (!this.config.useScribbleFill || !this.data.datasets || this.data.datasets.length === 0 || !this.defs) {
            return [];
        }

        // Get colors from datasets or use default line color
        const colors = this.data.datasets.map(dataset =>
            dataset.lineColor || this.config.lineColor
        ).filter((color): color is string => typeof color === 'string' && color.length > 0);

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

    private renderGrid(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        // Create tick values manually
        const xTicks = this.xScale.domain();
        const yTicks = this.yScale.ticks(5);

        if (xTicks.length === 0 || yTicks.length === 0) return;

        const gridLinesX = d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat(() => '');

        const gridLinesY = d3.axisLeft(this.yScale)
            .tickSize(-this.width)
            .tickFormat(() => '');

        this.svg.append('g')
            .attr('class', 'grid grid-x')
            .attr('transform', `translate(0, ${this.height})`)
            .call(gridLinesX)
            .selectAll('line')
            .attr('stroke', this.config.gridColor)
            .attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', this.config.handDrawnEffect ? '5,3' : 'none');

        this.svg.append('g')
            .attr('class', 'grid grid-y')
            .call(gridLinesY)
            .selectAll('line')
            .attr('stroke', this.config.gridColor)
            .attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', this.config.handDrawnEffect ? '5,3' : 'none');
    }

    private renderAxes(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        const xAxis = d3.axisBottom(this.xScale);
        const yAxis = d3.axisLeft(this.yScale);

        this.svg.append('g')
            .attr('class', 'x axis hand-drawn-axis')
            .attr('transform', `translate(0, ${this.height})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-family', this.config.fontFamily);

        this.svg.append('g')
            .attr('class', 'y axis hand-drawn-axis')
            .call(yAxis)
            .selectAll('text')
            .style('font-family', this.config.fontFamily);

        if (this.config.handDrawnEffect) {
            this.svg.selectAll('.hand-drawn-axis path')
                .attr('stroke-width', 2)
                .attr('stroke-linecap', this.config.strokeLinecap)
                .attr('stroke-linejoin', this.config.strokeLinejoin);
        }
    }

    // Render Line charts as area charts using optional scribble fill flags
    private renderAreas(fillPatterns: string[] = []): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        this.data.datasets.forEach((dataset, index) => {
            if (!dataset.data || dataset.data.length === 0) return;

            const lineColor = dataset.lineColor || this.config.lineColor;
            let fillPattern: string;
            
            if (this.config.useScribbleFill) {
                if (fillPatterns.length > 0) {
                    fillPattern = fillPatterns[index % fillPatterns.length];
                } else {
                    // Force create a pattern if needed
                    console.warn('No fill patterns available, creating emergency pattern');
                    const emergencyPatterns = ScribbleFillUtils.createScribblePatternSet(this.defs!, [lineColor]);
                    fillPattern = emergencyPatterns.length > 0 ? emergencyPatterns[0] : lineColor;
                }
            } else {
                fillPattern = lineColor;
            }

            const area = d3.area<number>()
                .x((_, i) => {
                    const label = this.data.labels[i];
                    return this.xScale!(label) || 0;
                })
                .y0(this.yScale!(0))
                .y1(d => this.yScale!(d))
                .curve(d3.curveMonotoneX)
                .defined(d => d != null && !isNaN(d));

            const areaString = area(dataset.data);
            if (!areaString) return;

            const areaElement = this.svg.append('path')
                .datum(dataset.data)
                .attr('class', 'area')
                .attr('fill', fillPattern)
                .attr('fill-opacity', 0.3)
                .attr('stroke', 'none');

            if (this.config.handDrawnEffect) {
                const handDrawnArea = HandDrawnUtils.addHandDrawnEffect(
                    areaString,
                    this.config.handDrawnJitter / 2,
                    this.config.handDrawnPoints
                );

                areaElement.attr('d', handDrawnArea);
            } else {
                areaElement.attr('d', areaString);
            }
        });
    }

    // Render lines for each dataset
    private renderLines(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        this.data.datasets.forEach((dataset) => {
            if (!dataset.data || dataset.data.length === 0) return;

            const lineColor = dataset.lineColor || this.config.lineColor;

            const line = d3.line<number>()
                .x((_, i) => {
                    const label = this.data.labels[i];
                    return this.xScale!(label) || 0;
                })
                .y(d => this.yScale!(d))
                .curve(d3.curveMonotoneX)
                .defined(d => d != null && !isNaN(d)); // Rendering only defined points

            const pathString = line(dataset.data);
            if (!pathString) return;

            const pathElement = this.svg.append('path')
                .datum(dataset.data)
                .attr('class', 'line')
                .attr('fill', 'none')
                .attr('stroke', lineColor)
                .attr('stroke-width', 3);

            if (this.config.handDrawnEffect) {
                const handDrawnPath = HandDrawnUtils.addHandDrawnEffect(
                    pathString,
                    this.config.handDrawnJitter,
                    this.config.handDrawnPoints
                );

                pathElement
                    .attr('d', handDrawnPath)
                    .attr('stroke-linecap', this.config.strokeLinecap)
                    .attr('stroke-linejoin', this.config.strokeLinejoin);
            } else {
                pathElement.attr('d', pathString);
            }
        });
    }

    // Render points for each dataset with optional scribble fill
    private renderPoints(fillPatterns: string[] = []): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        this.data.datasets.forEach((dataset, index) => {
            if (!dataset.data || dataset.data.length === 0) return;

            const lineColor = dataset.lineColor || this.config.lineColor;
            const fillPattern = this.config.useScribbleFill && fillPatterns.length > 0
                ? fillPatterns[index % fillPatterns.length]
                : lineColor;

            this.svg.selectAll(`.dot-${index}`)
                .data(dataset.data.filter(d => d != null && !isNaN(d)))
                .enter().append('circle')
                .attr('class', `dot dot-${index}`)
                .attr('cx', (_, i) => {
                    const label = this.data.labels[i];
                    const baseX = this.xScale!(label) || 0;
                    return this.config.handDrawnEffect
                        ? baseX + (Math.random() - 0.5) * (this.config.handDrawnJitter / 2)
                        : baseX;
                })
                .attr('cy', d => {
                    const baseY = this.yScale!(d);
                    return this.config.handDrawnEffect
                        ? baseY + (Math.random() - 0.5) * (this.config.handDrawnJitter / 2)
                        : baseY;
                })
                .attr('r', this.config.pointRadius)
                .attr('fill', fillPattern)
                .attr('stroke', lineColor)
                .attr('stroke-width', 2);
        });
    }

    private renderLegend(fillPatterns: string[] = []): void {
        if (!this.data.datasets || this.data.datasets.length === 0 || !this.svg) return;

        const legendGroup = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - 150}, 20)`);

        if (this.config.legendBorder) {
            legendGroup.append('rect')
                .attr('fill', this.config.tooltipBgColor)
                .attr('fill-opacity', this.config.tooltipOpacity)
                .attr('stroke', this.config.tooltipBorderColor)
                .attr('stroke-width', this.config.tooltipBorderWidth)
                .attr('rx', this.config.tooltipBorderRadius)
                .attr('ry', this.config.tooltipBorderRadius)
                .attr('filter', this.config.handDrawnEffect ? 'url(#xkcdify)' : null)
                .attr('width', 120)
                .attr('height', (this.data.datasets.length * 20) + 10);
        }

        this.data.datasets.forEach((dataset, index) => {
            const lineColor = dataset.lineColor || this.config.lineColor;
            const fillPattern = this.config.useScribbleFill && fillPatterns.length > 0
                ? fillPatterns[index % fillPatterns.length]
                : lineColor;

            legendGroup.append('rect')
                .attr('x', this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
                .attr('y', index * 20 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .attr('width', 8)
                .attr('height', 8)
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('fill', fillPattern)
                .attr('filter', this.config.handDrawnEffect ? 'url(#xkcdify)' : null);

            legendGroup.append('text')
                .attr('x', 15 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .attr('y', index * 20 + 8 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .text(dataset.label || `Series ${index + 1}`)
                .style('font-size', '14px')
                .style('font-family', this.config.fontFamily)
                .style('fill', this.config.tooltipTextColor)
                .attr('alignment-baseline', 'middle');
        });
    }

    // Setup interactions for hover effects and tooltips
    private setupInteractions(): void {
        if (!this.data.labels || this.data.labels.length === 0 || !this.xScale || !this.svg) return;

        const hoverAreas = this.svg.append('g').attr('class', 'hover-areas');

        this.data.labels.forEach((label, i) => {
            const xPos = this.xScale!(label);
            if (!xPos) return;

            hoverAreas.append('rect')
                .attr('class', 'hover-area')
                .attr('x', xPos - (this.width / this.data.labels.length) / 2)
                .attr('y', 0)
                .attr('width', this.width / this.data.labels.length)
                .attr('height', this.height)
                .attr('fill', 'transparent')
                .attr('data-index', i)
                .attr('data-label', label);
        });

        // Add event listeners for hover areas
        hoverAreas.selectAll('.hover-area')
            .on('mouseover', (event) => this.handleMouseOver(event))
            .on('mousemove', (event) => this.handleMouseMove(event))
            .on('mouseout', () => this.handleMouseOut());
    }

    // Handle mouse over event to show tooltip and highlight points
    private handleMouseOver(event: MouseEvent): void {
        if (!this.xScale || !this.svg || !this.hoverLine) return;

        const target = event.target as SVGElement;
        const index = parseInt(target.getAttribute('data-index')!);
        const label = this.data.labels[index];
        const xPos = this.xScale(label);

        if (!xPos) return;

        // Highlight data points
        this.data.datasets.forEach((_, datasetIndex) => {
            this.svg!.selectAll(`.dot-${datasetIndex}`)
                .filter((_, di) => di === index)
                .attr('r', this.config.pointRadius * 1.5)
                .attr('stroke', '#000')
                .attr('stroke-width', 1);
        });

        // Create tooltip items
        const tooltipItems: TooltipItem[] = this.data.datasets
            .filter(dataset => dataset.data && dataset.data[index] != null)
            .map(dataset => ({
                color: dataset.lineColor || this.config.lineColor,
                text: `${dataset.label || 'Series'}: ${this.config.valueFormat(dataset.data[index])}`
            }));

        if (tooltipItems.length === 0) return;

        // Get mouse position
        const svgNode = this.svg.node()!;
        const svgRect = svgNode.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left - this.margin.left;
        const mouseY = event.clientY - svgRect.top - this.margin.top;

        if (!this.tooltip) {
            this.tooltip = new Tooltip({
                parent: this.svg as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
                title: label,
                items: tooltipItems,
                position: { type: 'auto', x: mouseX, y: mouseY },
                unxkcdify: !this.config.handDrawnEffect,
                backgroundColor: this.config.tooltipBgColor,
                strokeColor: this.config.tooltipBorderColor,
                fontFamily: this.config.fontFamily,
                chartWidth: this.width,
                chartHeight: this.height
            });
            this.tooltip.show();
        } else {
            this.tooltip.update({
                title: label,
                items: tooltipItems,
                position: { type: 'auto', x: mouseX, y: mouseY }
            });
            this.tooltip.show();
        }

        // Show hover line
        this.hoverLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', 0)
            .attr('y2', this.height)
            .attr('stroke', '#888')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '5,3')
            .style('opacity', 1);
    }

    // Handle mouse move event to update tooltip position
    private handleMouseMove(event: MouseEvent): void {
        if (this.tooltip && this.svg) {
            const svgNode = this.svg.node()!;
            const svgRect = svgNode.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - this.margin.left;
            const mouseY = event.clientY - svgRect.top - this.margin.top;

            this.tooltip.update({
                position: { type: 'auto', x: mouseX, y: mouseY }
            });
        }
    }

    private handleMouseOut(): void {
        if (this.tooltip) {
            this.tooltip.hide();
        }

        // animate points back to normal size to add a nice effect
        if (this.svg) {
            this.svg.selectAll('.dot')
                .attr('r', this.config.pointRadius)
                .attr('stroke', (d, i, nodes) => {
                    const element = nodes[i] as SVGCircleElement;
                    const classList = element.getAttribute('class') || '';
                    const datasetIndex = classList.match(/dot-(\d+)/)?.[1] || '0';
                    const dataset = this.data.datasets[parseInt(datasetIndex)];
                    return dataset?.lineColor || this.config.lineColor;
                })
                .attr('stroke-width', 2);
        }

        if (this.hoverLine) {
            this.hoverLine.style('opacity', 0);
        }
    }

    // Override the destroy method to clean up the tooltip and hover line
    public destroy(): void {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        super.destroy();
    }
}