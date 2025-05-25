import * as d3 from 'd3';
import { ChartPosition, TooltipItem } from '../types';

interface TooltipConfig {
    parent: d3.Selection<SVGGElement, unknown, null, undefined>;
    title: string;
    items: TooltipItem[];
    position: ChartPosition;
    unxkcdify?: boolean;
    backgroundColor: string;
    strokeColor: string;
    fontFamily: string;
    chartWidth: number;
    chartHeight: number;
}

// This class implements a tooltip for displaying information in a hand-drawn style chart.
export class Tooltip {
    private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private tipBackground!: d3.Selection<SVGRectElement, unknown, null, undefined>;
    private tipTitle!: d3.Selection<SVGTextElement, unknown, null, undefined>;
    private tipItems: Array<{ svg: d3.Selection<SVGSVGElement, unknown, null, undefined>; width: number; height: number }> = [];
    private filter: string | null;
    private safetyBuffer = 10;

    constructor(private options: TooltipConfig) {
        this.filter = !options.unxkcdify ? 'url(#xkcdify)' : null;
        this.initialize();
    }

    private initialize(): void {
        this.svg = this.options.parent.append('svg')
            .attr('class', 'xkcd-tooltip')
            .attr('x', this.getUpLeftX())
            .attr('y', this.getUpLeftY())
            .style('visibility', 'hidden')
            .style('pointer-events', 'none')
            .style('z-index', 1000);

        this.createBackground();
        this.createTitle();
        this.createItems();
    }

    // Creates the tooltip background rectangle with a hand-drawn effect.
    private createBackground(): void {
        this.tipBackground = this.svg.append('rect')
            .style('fill', this.options.backgroundColor)
            .attr('fill-opacity', 0.9)
            .attr('stroke', this.options.strokeColor)
            .attr('stroke-width', 2)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('filter', this.filter)
            .attr('width', this.getBackgroundWidth())
            .attr('height', this.getBackgroundHeight())
            .attr('x', 5)
            .attr('y', 5);
    }

    // Creates the tooltip title text element.
    private createTitle(): void {
        this.tipTitle = this.svg.append('text')
            .style('font-size', 15)
            .style('font-weight', 'bold')
            .style('fill', this.options.strokeColor)
            .style('font-family', this.options.fontFamily)
            .attr('x', 15)
            .attr('y', 25)
            .text(this.options.title);
    }

    // Creates the tooltip items based on the provided configuration.
    private createItems(): void {
        this.tipItems = this.options.items.map((item, i) => this.generateTipItem(item, i));
    }

    // Generates a single tooltip item with its SVG representation.
    private generateTipItem(item: TooltipItem, index: number): { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>; width: number; height: number } {
        const svg = this.svg.append('svg');

        svg.append('rect')
            .style('fill', item.color)
            .attr('width', 8)
            .attr('height', 8)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('filter', this.filter)
            .attr('x', 15)
            .attr('y', 37 + 20 * index);

        svg.append('text')
            .style('font-size', '15')
            .style('fill', this.options.strokeColor)
            .style('font-family', this.options.fontFamily)
            .attr('x', 15 + 12)
            .attr('y', 37 + 20 * index + 8)
            .text(item.text);

        const bbox = svg.node()!.getBBox();
        return {
            svg,
            width: bbox.width + 15,
            height: bbox.height + 10,
        };
    }

    // Calculates the width and height of the tooltip background based on the title and items.
    private getBackgroundWidth(): number {
        const maxItemLength = this.options.items.reduce(
            (max, item) => Math.max(max, item.text.length),
            0
        );
        const maxLength = Math.max(maxItemLength, this.options.title.length);
        return maxLength * 7.4 + 25;
    }

    private getBackgroundHeight(): number {
        return (this.options.items.length + 1) * 20 + 10;
    }

    // Calculates the position of the tooltip based on the provided position type and chart dimensions.
    private getUpLeftX(): number {
        const tooltipWidth = this.getBackgroundWidth() + 20;

        if (this.options.position.type === 'auto') {
            const mouseX = this.options.position.x;

            if (mouseX + tooltipWidth + this.safetyBuffer > this.options.chartWidth) {
                return mouseX - tooltipWidth - 10;
            }
            return mouseX + 10;
        }

        if (this.options.position.type === 'upRight' || this.options.position.type === 'downRight') {
            return this.options.position.x;
        }
        return this.options.position.x - tooltipWidth;
    }

    // Calculates the vertical position of the tooltip based on the provided position type and chart dimensions.
    private getUpLeftY(): number {
        const tooltipHeight = this.getBackgroundHeight() + 20;

        if (this.options.position.type === 'auto') {
            const mouseY = this.options.position.y;

            if (mouseY + tooltipHeight + this.safetyBuffer > this.options.chartHeight) {
                return mouseY - tooltipHeight - 10;
            }

            if (mouseY - this.safetyBuffer < 0) {
                return this.safetyBuffer;
            }

            return mouseY + 10;
        }

        if (this.options.position.type === 'downLeft' || this.options.position.type === 'downRight') {
            return this.options.position.y;
        }
        return this.options.position.y - tooltipHeight;
    }

    public show(): void {
        this.svg.style('visibility', 'visible');
    }

    public hide(): void {
        this.svg.style('visibility', 'hidden');
    }

    // Updates the tooltip with new title, items, or position.
    public update(updates: { title?: string; items?: TooltipItem[]; position?: ChartPosition }): void {
        if (updates.title && updates.title !== this.options.title) {
            this.options.title = updates.title;
            this.tipTitle.text(updates.title);
        }

        if (updates.items && JSON.stringify(updates.items) !== JSON.stringify(this.options.items)) {
            this.options.items = updates.items;

            this.tipItems.forEach(item => item.svg.remove());
            this.tipItems = this.options.items.map((item, i) => this.generateTipItem(item, i));

            const maxWidth = Math.max(
                ...this.tipItems.map(item => item.width),
                this.tipTitle.node()!.getBBox().width
            );

            this.tipBackground
                .attr('width', maxWidth + 15)
                .attr('height', this.getBackgroundHeight());
        }

        if (updates.position) {
            this.options.position = updates.position;
            this.svg.attr('x', this.getUpLeftX()).attr('y', this.getUpLeftY());
        }
    }

    // Removes the tooltip from the DOM.
    public remove(): void {
        this.svg.remove();
    }
}