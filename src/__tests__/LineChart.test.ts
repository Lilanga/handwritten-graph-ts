import { LineChart } from '../charts/LineChart';
import { LineChartData, LineChartConfig } from '../types';

describe('LineChart', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    const mockData: LineChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
            {
                label: 'Revenue',
                data: [65, 59, 80, 81, 56],
                lineColor: 'rgb(75, 192, 192)'
            },
            {
                label: 'Expenses',
                data: [30, 45, 51, 60, 48],
                lineColor: 'rgb(255, 99, 132)'
            }
        ]
    };

    test('should create a line chart with default configuration', () => {
        const chart = new LineChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();
        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should create a line chart with custom configuration', () => {
        const config: Partial<LineChartConfig> = {
            width: 800,
            height: 600,
            handDrawnEffect: false,
            lineColor: 'blue'
        };

        const chart = new LineChart('#test-container', mockData, config);

        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('width')).toBe('800');
        expect(svg?.getAttribute('height')).toBe('600');
    });

    test('should handle empty datasets gracefully', () => {
        const emptyData: LineChartData = {
            labels: [],
            datasets: []
        };

        expect(() => {
            new LineChart('#test-container', emptyData);
        }).not.toThrow();
    });

    test('should destroy chart properly', () => {
        const chart = new LineChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();

        chart.destroy();

        expect(container.querySelector('.handwritten-graph-container')).toBeFalsy();
    });
});