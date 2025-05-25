import { HandDrawnUtils } from '../../utils/handDrawnUtils';

describe('HandDrawnUtils', () => {
    test('should add hand-drawn effect to path', () => {
        const originalPath = 'M 10 10 L 90 90';
        const result = HandDrawnUtils.addHandDrawnEffect(originalPath, 2, 10);

        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result).not.toBe(originalPath);
    });

    test('should create hand-drawn rectangle', () => {
        const result = HandDrawnUtils.createHandDrawnRect(0, 0, 100, 50, 2);

        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^M/); // Should start with a move command
    });

    test('should create hand-drawn circle', () => {
        const result = HandDrawnUtils.createHandDrawnCircle(50, 50, 25, 2);

        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^M/); // Should start with a move command
    });

    test('should handle invalid inputs gracefully', () => {
        expect(() => {
            HandDrawnUtils.addHandDrawnEffect('', 0, 0);
        }).not.toThrow();

        expect(() => {
            HandDrawnUtils.createHandDrawnRect(-10, -10, 0, 0, 0);
        }).not.toThrow();

        expect(() => {
            HandDrawnUtils.createHandDrawnCircle(0, 0, 0, 0);
        }).not.toThrow();
    });
});