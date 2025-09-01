import { ScribbleFillUtils } from '../../utils/scribbleFillUtils';
import * as d3 from 'd3';

describe('ScribbleFillUtils', () => {
    let mockDefs: any;
    let mockDefsElement: any;

    beforeEach(() => {
        // Create a mock DOM element
        mockDefsElement = {
            querySelector: jest.fn(() => null), // Pattern doesn't exist initially
            nodeType: 1
        };

        // Create a mock SVG defs element
        mockDefs = {
            append: jest.fn().mockReturnThis(),
            attr: jest.fn().mockReturnThis(),
            selectAll: jest.fn().mockReturnThis(),
            data: jest.fn().mockReturnThis(),
            enter: jest.fn().mockReturnThis(),
            select: jest.fn(() => ({
                remove: jest.fn(),
                empty: jest.fn(() => true) // Return true to indicate the selection is empty (filter doesn't exist)
            })),
            node: jest.fn(() => mockDefsElement) // Add the missing node() method
        };
    });

    test('should create directional scribble pattern', () => {
        const result = ScribbleFillUtils.createDirectionalScribblePattern(
            mockDefs,
            'test-pattern',
            '#FF0000',
            8,
            120,
            120,
            45
        );

        expect(result).toBe('url(#test-pattern)');
        expect(mockDefs.append).toHaveBeenCalledWith('pattern');
        expect(mockDefs.select).toHaveBeenCalled();
    });

    test('should create scribble pattern set', () => {
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const result = ScribbleFillUtils.createScribblePatternSet(mockDefs, colors);

        expect(result).toHaveLength(3);
        expect(result.every(pattern => pattern.startsWith('url(#'))).toBe(true);
    });

    test('should create oil paint pattern', () => {
        const result = ScribbleFillUtils.createOilPaintPattern(
            mockDefs,
            'oil-test',
            '#FF0000'
        );

        expect(result).toBe('url(#oil-test)');
        expect(mockDefs.append).toHaveBeenCalledWith('pattern');
    });

    test('should create oil paint pattern set', () => {
        const colors = ['#FF0000', '#00FF00'];
        const result = ScribbleFillUtils.createOilPaintPatternSet(mockDefs, colors);

        expect(result).toHaveLength(2);
        expect(result.every(pattern => pattern.startsWith('url(#'))).toBe(true);
    });
});