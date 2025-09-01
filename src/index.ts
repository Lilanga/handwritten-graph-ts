import { LineChart } from './charts/LineChart';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { UXEnhancementUtils } from './utils/uxEnhancementUtils';
import {
    LineChartData,
    LineChartConfig,
    BarChartData,
    BarChartConfig,
    PieChartData,
    PieChartConfig,
    ChartMargin,
    ChartPosition,
    TooltipItem,
    LineDataset,
    BarDataset,
    PieChartDataItem,
    BaseChartConfig,
    ILineChart,
    IBarChart,
    IPieChart,
    LineChartFactory,
    BarChartFactory,
    PieChartFactory,
    HandwrittenGraphNamespace
} from './types';
import './styles/graph.scss';

// Chart types and utilities supported by the library
export { LineChart, BarChart, PieChart, UXEnhancementUtils };

// Exporting all types and interfaces for external use
export type {
    LineChartData,
    LineChartConfig,
    BarChartData,
    BarChartConfig,
    PieChartData,
    PieChartConfig,
    ChartMargin,
    ChartPosition,
    TooltipItem,
    LineDataset,
    BarDataset,
    PieChartDataItem,
    BaseChartConfig,
    ILineChart,
    IBarChart,
    IPieChart,
    LineChartFactory,
    BarChartFactory,
    PieChartFactory,
    HandwrittenGraphNamespace
};

// Following functions create instances of LineChart, PieChart and BarChart and return a cleanup function to destroy the chart.
// Factory function for creating a line chart to backward compatibility with the handwritten-graph js library.
export const createGraph: LineChartFactory = (
    selector: string,
    data: LineChartData,
    config?: Partial<LineChartConfig>
): () => void => {
    const chart = new LineChart(selector, data, config);
    return () => chart.destroy();
};

// Factory function for creating a bar chart aligned with the handwritten-graph js library.
export const createBarChart: BarChartFactory = (
    selector: string,
    data: BarChartData,
    config?: Partial<BarChartConfig>
): () => void => {
    const chart = new BarChart(selector, data, config);
    return () => chart.destroy();
};

// Factory function for creating a pie chart aligned with the handwritten-graph js library.
export const createPieChart: PieChartFactory = (
    selector: string,
    data: PieChartData,
    config?: Partial<PieChartConfig>
): () => void => {
    const chart = new PieChart(selector, data, config);
    return () => chart.destroy();
};

// Default export of the library namespace
export default {
    LineChart,
    BarChart,
    PieChart,
    UXEnhancementUtils,
    createGraph,
    createBarChart,
    createPieChart
} as HandwrittenGraphNamespace;