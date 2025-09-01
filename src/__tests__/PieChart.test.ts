import { PieChart } from '../charts/PieChart';
import { PieChartData, PieChartConfig } from '../types';

describe('PieChart', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    const mockData: PieChartData = [
        { label: 'Marketing', value: 30, color: '#FF6384' },
        { label: 'Development', value: 45, color: '#36A2EB' },
        { label: 'Research', value: 15, color: '#FFCE56' },
        { label: 'Administration', value: 10, color: '#4BC0C0' }
    ];

    test('should create a pie chart with default configuration', () => {
        const chart = new PieChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();
        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should create a donut chart when innerRadius is set', () => {
        const config: Partial<PieChartConfig> = {
            innerRadius: 50
        };

        const chart = new PieChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should generate colors when not provided', () => {
        const dataWithoutColors: PieChartData = [
            { label: 'A', value: 30 },
            { label: 'B', value: 45 },
            { label: 'C', value: 15 }
        ];

        expect(() => {
            new PieChart('#test-container', dataWithoutColors);
        }).not.toThrow();
    });

    test('should handle scribble fill patterns', () => {
        const config: Partial<PieChartConfig> = {
            useScribbleFill: true,
            fillStyle: 'directional'
        };

        const chart = new PieChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should handle oil paint fill patterns', () => {
        const config: Partial<PieChartConfig> = {
            useScribbleFill: false,
            fillStyle: 'oilpaint'
        };

        const chart = new PieChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
        expect(container.querySelector('defs')).toBeTruthy();
    });

    test('should handle empty data', () => {
        expect(() => {
            new PieChart('#test-container', []);
        }).not.toThrow();
    });

    test('should handle null/undefined data', () => {
        expect(() => {
            new PieChart('#test-container', null as any);
        }).not.toThrow();
    });

    test('should handle legend border configuration', () => {
        const config: Partial<PieChartConfig> = {
            legendBorder: true
        };

        const chart = new PieChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should handle custom dimensions', () => {
        const config: Partial<PieChartConfig> = {
            width: 600,
            height: 400
        };

        const chart = new PieChart('#test-container', mockData, config);

        expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should destroy chart properly', () => {
        const chart = new PieChart('#test-container', mockData);

        expect(container.querySelector('.handwritten-graph-container')).toBeTruthy();

        chart.destroy();

        expect(container.querySelector('.handwritten-graph-container')).toBeFalsy();
    });
});