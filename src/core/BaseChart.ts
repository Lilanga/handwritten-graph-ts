import * as d3 from 'd3';
import { BaseChartConfig, ChartMargin } from '../types';

// Abstract chart class for creating hand-drawn style charts.
export abstract class BaseChart<TData, TConfig extends BaseChartConfig> {
    protected config!: Required<TConfig>;
    protected container!: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    protected svg!: d3.Selection<SVGGElement, unknown, null, undefined>;
    protected defs!: d3.Selection<SVGDefsElement, unknown, null, undefined>;
    protected data!: TData;
    protected width!: number;
    protected height!: number;
    protected margin!: Required<ChartMargin>;
    private isInitialized: boolean = false;

    constructor(
        protected selector: string,
        data: TData,
        config: TConfig,
        protected defaultConfig: Required<TConfig>
    ) {
        this.data = data;
        this.config = { ...defaultConfig, ...config } as Required<TConfig>;
        this.margin = { ...defaultConfig.margin, ...config.margin } as Required<ChartMargin>;
        this.width = ((this.config.width ?? defaultConfig.width) || 0) - (this.margin.left + this.margin.right);
        this.height = ((this.config.height ?? defaultConfig.height) || 0) - (this.margin.top + this.margin.bottom);

        this.initializeContainer();
        this.initializeSVG();

        // Mark as initialized but don't render yet - let child classes control when to render
        this.isInitialized = true;
    }

    protected renderChart(): void {
        if (this.isInitialized) {
            this.render();
        }
    }

    // Initializes the container for the chart, appending a div to the specified selector.
    // This container will hold the SVG element and any other chart elements.
    private initializeContainer(): void {
        this.container = d3.select(this.selector)
            .append('div')
            .attr('class', 'handwritten-graph-container');
    }

    // Initializes the SVG element within the container.
    // This SVG will be used to draw the chart elements.
    private initializeSVG(): void {
        const svgElement = this.container
            .append('svg')
            .attr('width', this.config.width ?? 0)
            .attr('height', this.config.height ?? 0);

        this.svg = svgElement
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`) as unknown as d3.Selection<SVGGElement, unknown, null, undefined>;

        this.defs = svgElement.append('defs') as unknown as d3.Selection<SVGDefsElement, unknown, null, undefined>;
    }

    // Creates the xkcd-style filter if enabled in the configuration
    // This filter applies a hand-drawn effect to the SVG elements
    protected createXkcdFilter(): void {
        if (!this.config?.handDrawnEffect || !this.defs) return;

        // Check if filter already exists
        if (this.defs.select('#xkcdify').node()) return;

        const filter = this.defs.append('filter').attr('id', 'xkcdify');

        filter.append('feTurbulence')
            .attr('type', 'fractalNoise')
            .attr('baseFrequency', '0.05')
            .attr('numOctaves', '1')
            .attr('seed', '0');

        filter.append('feDisplacementMap')
            .attr('scale', '3')
            .attr('xChannelSelector', 'R')
            .attr('yChannelSelector', 'G')
            .attr('in', 'SourceGraphic');
    }

    // Checks if the chart is ready to be rendered
    // This method ensures that the SVG and defs elements are initialized before rendering
    protected isReady(): boolean {
        return this.isInitialized && !!this.svg && !!this.defs;
    }

    protected abstract render(): void;

    // Here cleans up the chart by removing the container element from the DOM.
    public destroy(): void {
        if (this.container) {
            this.container.remove();
        }
    }
}