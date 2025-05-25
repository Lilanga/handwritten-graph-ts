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

export interface PieChartDataItem {
    label: string;
    value: number;
    color?: string;
}

export type PieChartData = PieChartDataItem[];

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

export interface LineChartConfig extends BaseChartConfig {
    lineColor?: string;
    pointRadius?: number;
    gridColor?: string;
    handDrawnPoints?: number;
    legendBorder?: boolean;
    valueFormat?: (value: number) => string;
}

export interface PieChartConfig extends BaseChartConfig {
    innerRadius?: number;
    padAngle?: number;
    cornerRadius?: number;
    legendBorder?: boolean;
    valueFormat?: (value: number) => string;
    useScribbleFill?: boolean;
    fillStyle?: 'directional' | 'oilpaint';
}