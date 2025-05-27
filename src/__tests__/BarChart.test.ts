import { BarChart } from '../charts/BarChart';
import { BarChartData } from '../types';

describe('BarChart', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    const mockData: BarChartData = {
        labels: ['A', 'B', 'C'],
        datasets: [
            {
                label: 'Series 1',
                data: [10, 20, 30],
                barColor: 'blue'
            }
        ]
    };

    test('should create a bar chart with default configuration', () => {
        const chart = new BarChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();
        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should create a bar chart with custom configuration', () => {
        const config = {
            width: 600,
            height: 300,
            handDrawnEffect: false,
            showValues: true
        };

        const chart = new BarChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should create a horizontal bar chart', () => {
        const config = {
            orientation: 'horizontal' as const,
            width: 600,
            height: 300
        };

        const chart = new BarChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should handle multiple datasets', () => {
        const multiDatasetData: BarChartData = {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [
                {
                    label: 'Sales',
                    data: [100, 150, 200, 250],
                    barColor: 'blue'
                },
                {
                    label: 'Profit',
                    data: [50, 75, 100, 125],
                    barColor: 'green'
                }
            ]
        };

        expect(() => {
            new BarChart('#test-container', multiDatasetData);
        }).not.toThrow();
    });

    test('should generate colors when not provided', () => {
        const dataWithoutColors: BarChartData = {
            labels: ['A', 'B', 'C'],
            datasets: [
                {
                    label: 'Series 1',
                    data: [10, 20, 30]
                }
            ]
        };

        expect(() => {
            new BarChart('#test-container', dataWithoutColors);
        }).not.toThrow();
    });

    test('should destroy chart properly', () => {
        const chart = new BarChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();

        chart.destroy();

        expect(container.querySelector('.handwritten-graph-container')).toBeFalsy();
    });

    test('should handle empty data gracefully', () => {
        const emptyData: BarChartData = {
            labels: [],
            datasets: []
        };

        expect(() => {
            new BarChart('#test-container', emptyData);
        }).not.toThrow();
    });

    test('should handle invalid data gracefully', () => {
        const invalidData = {
            labels: null,
            datasets: null
        };

        expect(() => {
            new BarChart('#test-container', invalidData as any);
        }).not.toThrow();
    });
});