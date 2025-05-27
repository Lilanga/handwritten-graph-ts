// Core interfaces and types for the handwritten graph library

export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartPosition {
    type: 'auto' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight';
    x: number;
    y: number;
}

export interface TooltipItem {
    color: string;
    text: string;
}

// Line Chart Types
export interface LineDataset {
    label: string;
    data: number[];
    lineColor?: string;
    jitter?: number;
}

export interface LineChartData {
    labels: string[];
    datasets: LineDataset[];
}

// Bar Chart Types
export interface BarDataset {
    label: string;
    data: number[];
    barColor?: string;
    borderColor?: string;
    borderWidth?: number;
}

export interface BarChartData {
    labels: string[];
    datasets: BarDataset[];
}

// Pie Chart Types
export interface PieChartDataItem {
    label: string;
    value: number;
    color?: string;
}

export type PieChartData = PieChartDataItem[];

// Base Configuration
export interface BaseChartConfig {
    width?: number;
    height?: number;
    margin?: Partial<ChartMargin>;
    fontFamily?: string;
    handDrawnEffect?: boolean;
    handDrawnJitter?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    tooltipBgColor?: string;
    tooltipTextColor?: string;
    tooltipBorderColor?: string;
    tooltipBorderWidth?: number;
    tooltipBorderRadius?: number;
    tooltipOpacity?: number;
}

// Line Chart Configuration
export interface LineChartConfig extends BaseChartConfig {
    lineColor?: string;
    pointRadius?: number;
    gridColor?: string;
    handDrawnPoints?: number;
    legendBorder?: boolean;
    valueFormat?: (value: number) => string;
}

// Bar Chart Configuration
export interface BarChartConfig extends BaseChartConfig {
    barColor?: string;
    borderColor?: string;
    borderWidth?: number;
    gridColor?: string;
    legendBorder?: boolean;
    valueFormat?: (value: number) => string;
    barSpacing?: number;
    groupSpacing?: number;
    showValues?: boolean;
    orientation?: 'vertical' | 'horizontal';
}

// Pie Chart Configuration
export interface PieChartConfig extends BaseChartConfig {
    innerRadius?: number;
    padAngle?: number;
    cornerRadius?: number;
    legendBorder?: boolean;
    valueFormat?: (value: number) => string;
    useScribbleFill?: boolean;
    fillStyle?: 'directional' | 'oilpaint';
}

// Chart Classes (these will be the actual exported classes)
export interface ILineChart {
    destroy(): void;
}

export interface IBarChart {
    destroy(): void;
}

export interface IPieChart {
    destroy(): void;
}

// Factory function types for backward compatibility
export type LineChartFactory = (
    selector: string,
    data: LineChartData,
    config?: Partial<LineChartConfig>
) => () => void;

export type BarChartFactory = (
    selector: string,
    data: BarChartData,
    config?: Partial<BarChartConfig>
) => () => void;

export type PieChartFactory = (
    selector: string,
    data: PieChartData,
    config?: Partial<PieChartConfig>
) => () => void;

// Library namespace for UMD builds
export interface HandwrittenGraphNamespace {
    LineChart: new (selector: string, data: LineChartData, config?: Partial<LineChartConfig>) => ILineChart;
    BarChart: new (selector: string, data: BarChartData, config?: Partial<BarChartConfig>) => IBarChart;
    PieChart: new (selector: string, data: PieChartData, config?: Partial<PieChartConfig>) => IPieChart;
    createGraph: LineChartFactory;
    createBarChart: BarChartFactory;
    createPieChart: PieChartFactory;
}