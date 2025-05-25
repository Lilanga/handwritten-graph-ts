import { LineChart } from './charts/LineChart';
import { PieChart } from './charts/PieChart';
import { LineChartData, LineChartConfig, PieChartData, PieChartConfig } from './types';
import './styles/graph.scss';

export { LineChart, PieChart };
export type { LineChartData, LineChartConfig, PieChartData, PieChartConfig };

// Factory functions for backward compatibility with handwritten-graph js library
// These functions create instances of LineChart and PieChart and return a cleanup function to destroy the chart.
export function createGraph(
    selector: string,
    data: LineChartData,
    config?: Partial<LineChartConfig>
): () => void {
    const chart = new LineChart(selector, data, config);
    return () => chart.destroy();
}

// Factory function for creating a pie chart aligned with the handwritten-graph js library.
export function createPieChart(
    selector: string,
    data: PieChartData,
    config?: Partial<PieChartConfig>
): () => void {
    const chart = new PieChart(selector, data, config);
    return () => chart.destroy();
}