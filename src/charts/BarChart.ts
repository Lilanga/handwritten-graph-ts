import * as d3 from 'd3';
import { BaseChart } from '../core/BaseChart';
import { BarChartData, BarChartConfig, TooltipItem, BarDataset } from '../types';
import { Tooltip } from '../components/Tooltip';
import { HandDrawnUtils } from '../utils/handDrawnUtils';

// default bar chart configurations
const DEFAULT_BAR_CONFIG: Required<BarChartConfig> = {
    width: 960,
    height: 500,
    margin: { top: 20, right: 150, bottom: 60, left: 60 },
    barColor: 'steelblue',
    borderColor: '#333',
    borderWidth: 2,
    fontFamily: 'xkcd',
    gridColor: '#e0e0e0',
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
    legendBorder: false,
    valueFormat: (d: number) => d3.format('.1f')(d),
    barSpacing: 0.1,
    groupSpacing: 0.2,
    showValues: false,
    orientation: 'vertical'
};

// BarChart class extending BaseChart to inherit common chart functionality
export class BarChart extends BaseChart<BarChartData, BarChartConfig> {
    private xScale: d3.ScaleBand<string> | null = null;
    private yScale: d3.ScaleLinear<number, number> | null = null;
    private colorScale: d3.ScaleOrdinal<string, string> | null = null;
    private tooltip: Tooltip | null = null;

    constructor(selector: string, data: BarChartData, config: Partial<BarChartConfig> = {}) {
        // Here we need to process and validate the data before passing it to the parent constructor
        const processedData = BarChart.validateAndProcessData(data);

        super(selector, processedData, config as BarChartConfig, DEFAULT_BAR_CONFIG);

        this.initializeScales();
        this.renderChart();
    }

    private static validateAndProcessData(data: BarChartData): BarChartData {
        // check if data is valid
        if (!data || typeof data !== 'object') {
            return { labels: [], datasets: [] };
        }

        // check if labels exist and are valid
        let labels = Array.isArray(data.labels) ? data.labels : [];

        // check if datasets exist and are valid
        let datasets = Array.isArray(data.datasets) ? data.datasets : [];

        // Clean up datasets
        datasets = datasets.filter(dataset =>
            dataset &&
            typeof dataset === 'object' &&
            Array.isArray(dataset.data) &&
            dataset.data.length > 0
        );

        // If no valid datasets, return empty data
        if (labels.length === 0 && datasets.length === 0) {
            labels = ['No Data'];
            datasets = [];
        }

        return { labels, datasets };
    }

    private initializeScales(): void {
        // Use the labels from the data or default to 'No Data'
        const labels = this.data.labels.length > 0 ? this.data.labels : ['No Data'];

        // There should be at least one dataset to create scales
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

        // If no valid values, use default range
        if (allValues.length === 0) {
            allValues.push(0, 10);
        }

        const maxValue = d3.max(allValues) || 10;
        const minValue = d3.min(allValues) || 0;

        if (this.config.orientation === 'horizontal') {
            // Create horizontal bar chart scales
            this.xScale = d3.scaleLinear()
                .domain([Math.min(0, minValue), Math.max(maxValue * 1.1, 10)])
                .range([0, this.width]) as any;

            this.yScale = d3.scaleBand<string>()
                .domain(labels)
                .range([0, this.height])
                .padding(this.config.groupSpacing) as any;
        } else {
            // Vertical bar chart scales if orientation is vertical or not specified
            this.xScale = d3.scaleBand<string>()
                .domain(labels)
                .range([0, this.width])
                .padding(this.config.groupSpacing);

            this.yScale = d3.scaleLinear()
                .domain([Math.min(0, minValue), Math.max(maxValue * 1.1, 10)])
                .range([this.height, 0]);
        }

        // Setting up color scale for datasets
        // We are using d3.schemeCategory10 for consistent coloring across datasets
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(this.data.datasets.map((_, i) => i.toString()));
    }

    protected render(): void {
        if (!this.xScale || !this.yScale) {
            this.initializeScales();
        }

        // We can only render if the chart is ready and scales are initialized
        if (!this.isReady() || !this.xScale || !this.yScale) {
            console.error('BarChart not ready for rendering');
            return;
        }

        if (!this.data.datasets || this.data.datasets.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.createXkcdFilter();
        this.renderGrid();
        this.renderAxes();
        this.renderBars();
        this.renderLegend();
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

    private renderGrid(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        if (this.config.orientation === 'horizontal') {
            // For horizontal bars, we draw horizontal grid lines
            const gridLines = d3.axisLeft(this.yScale as unknown as d3.AxisScale<string>)
                .tickSize(-this.width)
                .tickFormat(() => '');

            this.svg.append('g')
                .attr('class', 'grid')
                .call(gridLines as any)
                .selectAll('line')
                .attr('stroke', this.config.gridColor)
                .attr('stroke-opacity', 0.5)
                .attr('stroke-dasharray', this.config.handDrawnEffect ? '5,3' : 'none');
        } else {
            // Vertical grid lines for vertical bars
            const gridLines = d3.axisBottom(this.xScale as d3.AxisScale<string>)
                .tickSize(-this.height)
                .tickFormat(() => '');

            this.svg.append('g')
                .attr('class', 'grid')
                .attr('transform', `translate(0, ${this.height})`)
                .call(gridLines as any)
                .selectAll('line')
                .attr('stroke', this.config.gridColor)
                .attr('stroke-opacity', 0.5)
                .attr('stroke-dasharray', this.config.handDrawnEffect ? '5,3' : 'none');
        }
    }

    // we need to render the axes based on the orientation of the chart
    private renderAxes(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        if (this.config.orientation === 'horizontal') {
            const xAxis = d3.axisBottom(this.xScale as unknown as d3.AxisScale<d3.NumberValue>);
            const yAxis = d3.axisLeft(this.yScale as unknown as d3.AxisScale<string>);

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
        } else {
            const xAxis = d3.axisBottom(this.xScale as d3.AxisScale<string>);
            const yAxis = d3.axisLeft(this.yScale as d3.AxisScale<d3.NumberValue>);

            this.svg.append('g')
                .attr('class', 'x axis hand-drawn-axis')
                .attr('transform', `translate(0, ${this.height})`)
                .call(xAxis)
                .selectAll('text')
                .style('font-family', this.config.fontFamily)
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-45)');

            this.svg.append('g')
                .attr('class', 'y axis hand-drawn-axis')
                .call(yAxis)
                .selectAll('text')
                .style('font-family', this.config.fontFamily);
        }

        if (this.config.handDrawnEffect) {
            this.svg.selectAll('.hand-drawn-axis path')
                .attr('stroke-width', 2)
                .attr('stroke-linecap', this.config.strokeLinecap)
                .attr('stroke-linejoin', this.config.strokeLinejoin);
        }
    }

    // Here we render the bars based on the orientation of the chart
    private renderBars(): void {
        if (!this.xScale || !this.yScale || !this.svg) return;

        const barGroups = this.svg.selectAll('.bar-group')
            .data(this.data.labels)
            .enter()
            .append('g')
            .attr('class', 'bar-group');

        this.data.datasets.forEach((dataset, datasetIndex) => {
            if (!dataset.data || dataset.data.length === 0) return;

            const barColor = dataset.barColor || this.colorScale!(datasetIndex.toString());
            const borderColor = dataset.borderColor || this.config.borderColor;
            const borderWidth = dataset.borderWidth || this.config.borderWidth;

            const bars = barGroups.selectAll(`.bar-${datasetIndex}`)
                .data((d, i) => [{ label: d, value: dataset.data[i], datasetIndex }])
                .enter()
                .append('g')
                .attr('class', `bar bar-${datasetIndex}`);

            if (this.config.orientation === 'horizontal') {
                this.renderHorizontalBars(bars, dataset, datasetIndex, barColor, borderColor, borderWidth);
            } else {
                this.renderVerticalBars(bars, dataset, datasetIndex, barColor, borderColor, borderWidth);
            }
        });
    }

    // Render Vertical bars for vertical bar charts
    private renderVerticalBars(
        bars: d3.Selection<SVGGElement, { label: string; value: number; datasetIndex: number; }, SVGGElement, string>,
        dataset: BarDataset,
        datasetIndex: number,
        barColor: string,
        borderColor: string,
        borderWidth: number
    ): void {
        const barWidth = (this.xScale as d3.ScaleBand<string>).bandwidth() / this.data.datasets.length;
        const barOffset = barWidth * datasetIndex;

        bars.each((d: unknown, i: number, nodes: ArrayLike<SVGGElement>) => {
            const element = d3.select(nodes[i]);
            const barData = d as { label: string; value: number; datasetIndex: number };
            const value = barData.value;

            if (typeof value !== 'number' || isNaN(value)) return;

            const x = (this.xScale!(barData.label) || 0) + barOffset;
            const y = this.yScale!(Math.max(0, value));
            const height = this.yScale!(0) - this.yScale!(Math.abs(value));
            const width = barWidth * (1 - this.config.barSpacing);

            if (this.config.handDrawnEffect) {
                const path = HandDrawnUtils.createHandDrawnRect(
                    x, y, width, height, this.config.handDrawnJitter
                );

                element.append('path')
                    .attr('d', path)
                    .attr('fill', barColor)
                    .attr('stroke', borderColor)
                    .attr('stroke-width', borderWidth)
                    .attr('stroke-linecap', this.config.strokeLinecap)
                    .attr('stroke-linejoin', this.config.strokeLinejoin)
                    .attr('filter', 'url(#xkcdify)');
            } else {
                element.append('rect')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', width)
                    .attr('height', height)
                    .attr('fill', barColor)
                    .attr('stroke', borderColor)
                    .attr('stroke-width', borderWidth);
            }

            // Add value labels if enabled
            if (this.config.showValues) {
                element.append('text')
                    .attr('x', x + width / 2)
                    .attr('y', y - (this.config.handDrawnEffect ? Math.random() * 4 : 0) - 5)
                    .attr('text-anchor', 'middle')
                    .style('font-family', this.config.fontFamily)
                    .style('font-size', '12px')
                    .style('fill', this.config.tooltipTextColor)
                    .text(this.config.valueFormat(value));
            }

            // Store data for interactions
            element.datum({ label: barData.label, value, dataset: dataset.label, color: barColor });
        });
    }

    // Rendering horizontal bars for horizontal bar charts
    private renderHorizontalBars(
        bars: d3.Selection<SVGGElement, { label: string; value: number; datasetIndex: number; }, SVGGElement, string>,
        dataset: BarDataset,
        datasetIndex: number,
        barColor: string,
        borderColor: string,
        borderWidth: number
    ): void {
        const barHeight = (this.yScale as unknown as d3.ScaleBand<string>).bandwidth() / this.data.datasets.length;
        const barOffset = barHeight * datasetIndex;

        bars.each((d: unknown, i: number, nodes: ArrayLike<SVGGElement>) => {
            const element = d3.select(nodes[i]);
            const barData = d as { label: string; value: number; datasetIndex: number };
            const value = barData.value;

            if (typeof value !== 'number' || isNaN(value)) return;

            const x = (this.xScale as unknown as d3.ScaleLinear<number, number>)(Math.min(0, value));
            const y = ((this.yScale as unknown as d3.ScaleBand<string>)(barData.label) || 0) + barOffset;
            const width = Math.abs((this.xScale as unknown as d3.ScaleLinear<number, number>)(value) - (this.xScale as unknown as d3.ScaleLinear<number, number>)(0));
            const height = barHeight * (1 - this.config.barSpacing);

            if (this.config.handDrawnEffect) {
                const path = HandDrawnUtils.createHandDrawnRect(
                    x, y, width, height, this.config.handDrawnJitter
                );

                element.append('path')
                    .attr('d', path)
                    .attr('fill', barColor)
                    .attr('stroke', borderColor)
                    .attr('stroke-width', borderWidth)
                    .attr('stroke-linecap', this.config.strokeLinecap)
                    .attr('stroke-linejoin', this.config.strokeLinejoin)
                    .attr('filter', 'url(#xkcdify)');
            } else {
                element.append('rect')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', width)
                    .attr('height', height)
                    .attr('fill', barColor)
                    .attr('stroke', borderColor)
                    .attr('stroke-width', borderWidth);
            }

            // Add value labels if enabled
            if (this.config.showValues) {
                element.append('text')
                    .attr('x', x + width + (this.config.handDrawnEffect ? Math.random() * 4 : 0) + 5)
                    .attr('y', y + height / 2)
                    .attr('text-anchor', 'start')
                    .attr('alignment-baseline', 'middle')
                    .style('font-family', this.config.fontFamily)
                    .style('font-size', '12px')
                    .style('fill', this.config.tooltipTextColor)
                    .text(this.config.valueFormat(value));
            }

            // Store data for interactions
            element.datum({ label: barData.label, value, dataset: dataset.label, color: barColor });
        });
    }

    // Create the legend for the bar charts
    private renderLegend(): void {
        if (!this.data.datasets || this.data.datasets.length <= 1 || !this.svg) return;

        const legendGroup = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - 140}, 20)`);

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
            const barColor = dataset.barColor || this.colorScale!(index.toString());

            legendGroup.append('rect')
                .attr('x', this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0)
                .attr('y', index * 20 + (this.config.handDrawnEffect ? (Math.random() - 0.5) * 2 : 0))
                .attr('width', 8)
                .attr('height', 8)
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('fill', barColor)
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

    private setupInteractions(): void {
        if (!this.svg) return;

        this.svg.selectAll('.bar')
            .on('mouseover', (event, d) => this.handleMouseOver(event, d))
            .on('mousemove', (event) => this.handleMouseMove(event))
            .on('mouseout', () => this.handleMouseOut());
    }

    private handleMouseOver(event: MouseEvent, d: unknown): void {
        if (!this.svg) return;

        const barData = d as { label: string; value: number; dataset: string; color: string };

        // Highlight the bar
        d3.select(event.target as Element)
            .transition()
            .duration(200)
            .style('opacity', 0.8);

        const tooltipItems: TooltipItem[] = [
            { color: barData.color, text: `${barData.dataset}: ${this.config.valueFormat(barData.value)}` }
        ];

        const svgNode = this.svg.node()!;
        const svgRect = svgNode.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left - this.margin.left;
        const mouseY = event.clientY - svgRect.top - this.margin.top;

        if (!this.tooltip) {
            this.tooltip = new Tooltip({
                parent: this.svg,
                title: barData.label,
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
                title: barData.label,
                items: tooltipItems,
                position: { type: 'auto', x: mouseX, y: mouseY }
            });
            this.tooltip.show();
        }
    }

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

        d3.selectAll('.bar')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    // Override the destroy method to clean up the tooltip
    public destroy(): void {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        super.destroy();
    }
}