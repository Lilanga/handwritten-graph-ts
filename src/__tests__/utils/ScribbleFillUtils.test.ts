import { ScribbleFillUtils } from '../../utils/scribbleFillUtils';
import * as d3 from 'd3';

describe('ScribbleFillUtils', () => {
    let mockDefs: any;

    beforeEach(() => {
        // Create a mock SVG defs element
        mockDefs = {
            append: jest.fn().mockReturnThis(),
            attr: jest.fn().mockReturnThis(),
            selectAll: jest.fn().mockReturnThis(),
            data: jest.fn().mockReturnThis(),
            enter: jest.fn().mockReturnThis()
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