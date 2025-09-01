import { LineChart } from '../charts/LineChart';
import { LineChartData, LineChartConfig } from '../types';

describe('LineChart', () => {
    let container: HTMLDivElement;
    let chart: LineChart;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Destroy chart if it exists
        if (chart) {
            chart.destroy();
        }

        // Clean up DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        // Clear any remaining timers
        jest.clearAllTimers();
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
        chart = new LineChart('#test-container', mockData);

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

        chart = new LineChart('#test-container', mockData, config);

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
            chart = new LineChart('#test-container', emptyData);
        }).not.toThrow();
    });

    test('should handle showArea configuration', () => {
        const config: Partial<LineChartConfig> = {
            showArea: true
        };

        chart = new LineChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should handle scribble fill with area', () => {
        const config: Partial<LineChartConfig> = {
            showArea: true,
            useScribbleFill: true,
            fillStyle: 'directional'
        };

        chart = new LineChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
        expect(container.querySelector('defs')).toBeTruthy();
    });

    test('should handle oil paint fill with area', () => {
        const config: Partial<LineChartConfig> = {
            showArea: true,
            useScribbleFill: false,
            fillStyle: 'oilpaint'
        };

        chart = new LineChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
        expect(container.querySelector('defs')).toBeTruthy();
    });

    test('should handle multiple datasets', () => {
        const multiDatasetData: LineChartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [
                {
                    label: 'Series 1',
                    data: [10, 20, 30, 40],
                    lineColor: 'blue'
                },
                {
                    label: 'Series 2',
                    data: [15, 25, 35, 45],
                    lineColor: 'red'
                }
            ]
        };

        chart = new LineChart('#test-container', multiDatasetData);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should handle null/undefined data', () => {
        expect(() => {
            chart = new LineChart('#test-container', null as any);
        }).not.toThrow();
    });

    test('should destroy chart properly', () => {
        chart = new LineChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();

        chart.destroy();

        expect(container.querySelector('.handwritten-graph-container')).toBeFalsy();

        // Set to undefined since we manually destroyed it
        chart = undefined as any;
    });
});