/**
 * Setup file for Jest tests
 */

// Mock D3 DOM methods for testing
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        color: 'rgb(0, 0, 0)',
        getPropertyValue: (_prop: string) => ''
    })
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: jest.fn()
}));

// Mock SVG methods
const mockSVGPath = {
    getTotalLength: () => 100,
    getPointAtLength: (distance: number) => ({ x: distance, y: 0 })
};

// Add createElementNS mock for SVG creation
const originalCreateElementNS = document.createElementNS;
document.createElementNS = jest.fn((_namespace: string, tagName: string) => {
    const element = originalCreateElementNS
        ? originalCreateElementNS.call(document, 'http://www.w3.org/2000/svg', tagName)
        : document.createElement(tagName);

    if (tagName === 'path') {
        Object.assign(element, mockSVGPath);
    }
    return element as any;
});

// Global cleanup after each test
afterEach(() => {
    // Clear any timers that might be running
    jest.clearAllTimers();

    // Clear the document body to remove any leftover DOM elements
    document.body.innerHTML = '';

    // Clear any remaining event listeners
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = originalRemoveEventListener;

    // Force garbage collection if available (for Node.js environments)
    if (global.gc) {
        global.gc();
    }
});

// Global cleanup before each test
beforeEach(() => {
    // Use fake timers to control timing in tests
    jest.useFakeTimers();
});

// Global cleanup after all tests
afterAll(() => {
    // Clean up fake timers
    jest.useRealTimers();

    // Clear all mocks
    jest.clearAllMocks();

    // Reset all modules
    jest.resetModules();
});

// Mock D3 for testing
jest.mock('d3', () => {
    // Create a mock line builder
    const mockLineBuilder = () => {
        // Create the actual line generator function
        const lineGenerator = jest.fn((points: any[]) => {
            if (!points || points.length === 0) return '';
            return `M${points.map(p => `${p.x || p[0] || 0},${p.y || p[1] || 0}`).join('L')}`;
        });

        // Add the chainable methods to the function
        lineGenerator.x = jest.fn(() => lineGenerator);
        lineGenerator.y = jest.fn(() => lineGenerator);
        lineGenerator.curve = jest.fn(() => lineGenerator);
        lineGenerator.defined = jest.fn(() => lineGenerator);

        return lineGenerator;
    };

    // Create a D3 selection mock that actually interacts with the DOM
    const createMockSelection = (element?: Element) => {
        const selection = {
            append: jest.fn((tagName: string) => {
                const newElement = document.createElement(tagName);
                if (element) {
                    element.appendChild(newElement);
                }
                return createMockSelection(newElement);
            }),
            attr: jest.fn((name: string, value: any) => {
                if (element && typeof value !== 'function') {
                    element.setAttribute(name, String(value));
                }
                return selection;
            }),
            style: jest.fn((name: string, value: any) => {
                if (element && element instanceof HTMLElement && typeof value !== 'function') {
                    element.style.setProperty(name, String(value));
                }
                return selection;
            }),
            text: jest.fn((text: string) => {
                if (element) {
                    element.textContent = text;
                }
                return selection;
            }),
            remove: jest.fn(() => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                return selection;
            }),
            select: jest.fn((selector: string) => {
                if (element) {
                    const found = element.querySelector(selector);
                    return createMockSelection(found || undefined);
                }
                return createMockSelection();
            }),
            selectAll: jest.fn((selector: string) => {
                // For selectAll, we need to return a selection that can handle data binding
                return {
                    data: jest.fn((dataArray: any[]) => ({
                        enter: jest.fn(() => ({
                            append: jest.fn((tagName: string) => createMockSelection()),
                        })),
                        exit: jest.fn(() => ({ remove: jest.fn() })),
                    })),
                    attr: jest.fn().mockReturnThis(),
                    style: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    filter: jest.fn().mockReturnThis(),
                    each: jest.fn((callback: Function) => {
                        // Mock implementation of .each() - call the callback for each item
                        const mockData = [
                            { label: 'A', value: 10, datasetIndex: 0 },
                            { label: 'B', value: 20, datasetIndex: 0 },
                            { label: 'C', value: 30, datasetIndex: 0 }
                        ];
                        mockData.forEach((d, i) => {
                            const mockNode = document.createElement('g');
                            callback.call(mockNode, d, i, [mockNode]);
                        });
                        return selection;
                    }),
                    transition: jest.fn().mockReturnThis(),
                    duration: jest.fn().mockReturnThis(),
                };
            }),
            data: jest.fn((dataArray: any[]) => ({
                enter: jest.fn(() => ({
                    append: jest.fn((tagName: string) => createMockSelection()),
                })),
                exit: jest.fn(() => ({ remove: jest.fn() })),
            })),
            enter: jest.fn(() => ({
                append: jest.fn((tagName: string) => createMockSelection()),
            })),
            exit: jest.fn(() => ({ remove: jest.fn() })),
            on: jest.fn(() => selection),
            transition: jest.fn(() => selection),
            duration: jest.fn(() => selection),
            call: jest.fn(() => selection),
            filter: jest.fn(() => selection),
            datum: jest.fn(() => selection),
            each: jest.fn((callback: Function) => {
                // Mock implementation of .each() for single selections
                if (element) {
                    const mockData = { label: 'Test', value: 10, datasetIndex: 0 };
                    callback.call(element, mockData, 0, [element]);
                }
                return selection;
            }),
            node: jest.fn(() => element || null),
            empty: jest.fn(() => !element),
            size: jest.fn(() => element ? 1 : 0),
        };
        return selection;
    };

    return {
        select: jest.fn((selector: string) => {
            const element = document.querySelector(selector);
            return createMockSelection(element || undefined);
        }),
        selectAll: jest.fn((selector: string) => {
            // Return a mock selection that supports .transition() and other methods
            return {
                transition: jest.fn(() => ({
                    duration: jest.fn(() => ({
                        style: jest.fn().mockReturnThis(),
                        attr: jest.fn().mockReturnThis()
                    }))
                })),
                style: jest.fn().mockReturnThis(),
                attr: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                each: jest.fn((callback: Function) => {
                    // Mock some elements for testing
                    const mockElements = [
                        document.createElement('g'),
                        document.createElement('g'),
                        document.createElement('g')
                    ];
                    mockElements.forEach((el, i) => {
                        const mockData = { label: `Item ${i}`, value: i * 10 };
                        callback.call(el, mockData, i, mockElements);
                    });
                }),
            };
        }),
        scalePoint: jest.fn(() => {
            // Create a scale function that can be called with values
            const scaleFn = jest.fn((value: string) => {
                // Mock implementation: return a simple position based on value
                const index = ['A', 'B', 'C', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Q1', 'Q2', 'Q3', 'Q4'].indexOf(value);
                return index >= 0 ? index * 50 : 0;
            });

            // Add the chainable methods
            scaleFn.domain = jest.fn(() => scaleFn);
            scaleFn.range = jest.fn(() => scaleFn);
            scaleFn.padding = jest.fn(() => scaleFn);

            return scaleFn;
        }),
        scaleBand: jest.fn(() => {
            // Create a scale function that can be called with values
            const scaleFn = jest.fn((value: string) => {
                // Mock implementation: return a simple position based on value
                const index = ['A', 'B', 'C', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Q1', 'Q2', 'Q3', 'Q4'].indexOf(value);
                return index >= 0 ? index * 50 : 0;
            });

            // Add the chainable methods
            scaleFn.domain = jest.fn(() => scaleFn);
            scaleFn.range = jest.fn(() => scaleFn);
            scaleFn.padding = jest.fn(() => scaleFn);
            scaleFn.bandwidth = jest.fn(() => 40); // Mock bandwidth for bar charts

            return scaleFn;
        }),
        scaleLinear: jest.fn(() => {
            // Create a scale function that can be called with values
            const scaleFn = jest.fn((value: number) => {
                // Mock implementation: simple linear scaling
                return Math.max(0, Math.min(400, value * 5));
            });

            // Add the chainable methods
            scaleFn.domain = jest.fn(() => scaleFn);
            scaleFn.range = jest.fn(() => scaleFn);
            scaleFn.ticks = jest.fn(() => [0, 1, 2, 3, 4, 5]);

            return scaleFn;
        }),
        scaleOrdinal: jest.fn(() => {
            // Create a scale function that can be called with values
            const scaleFn = jest.fn((value: string) => {
                // Mock implementation: return a color based on index
                const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
                const index = parseInt(value) || 0;
                return colors[index % colors.length];
            });

            // Add the chainable methods
            scaleFn.domain = jest.fn(() => scaleFn);
            scaleFn.range = jest.fn(() => scaleFn);

            return scaleFn;
        }),
        line: mockLineBuilder,
        area: jest.fn(() => {
            const areaFn = jest.fn(() => 'M0,0L100,0L100,100L0,100Z');
            areaFn.x = jest.fn().mockReturnThis();
            areaFn.y0 = jest.fn().mockReturnThis();
            areaFn.y1 = jest.fn().mockReturnThis();
            areaFn.curve = jest.fn().mockReturnThis();
            areaFn.defined = jest.fn().mockReturnThis();
            return areaFn;
        }),
        pie: jest.fn(() => {
            const pieFn = jest.fn((data: any[]) =>
                data.map((d, i) => ({
                    data: d,
                    startAngle: i * 0.5,
                    endAngle: (i + 1) * 0.5,
                    padAngle: 0,
                }))
            );
            pieFn.value = jest.fn().mockReturnThis();
            pieFn.padAngle = jest.fn().mockReturnThis();
            pieFn.sort = jest.fn().mockReturnThis();
            return pieFn;
        }),
        arc: jest.fn(() => {
            const arcFn = jest.fn(() => 'M0,0L10,10A5,5,0,0,1,15,15Z');
            arcFn.innerRadius = jest.fn().mockReturnThis();
            arcFn.outerRadius = jest.fn().mockReturnThis();
            arcFn.cornerRadius = jest.fn().mockReturnThis();
            arcFn.centroid = jest.fn(() => [5, 5]);
            return arcFn;
        }),
        axisBottom: jest.fn(() => ({
            tickSize: jest.fn().mockReturnThis(),
            tickFormat: jest.fn().mockReturnThis(),
        })),
        axisLeft: jest.fn(() => ({
            tickSize: jest.fn().mockReturnThis(),
            tickFormat: jest.fn().mockReturnThis(),
        })),
        curveMonotoneX: 'curveMonotoneX',
        curveBasis: 'curveBasis',
        curveBasisClosed: 'curveBasisClosed',
        format: jest.fn(() => jest.fn((d: number) => d.toString())),
        max: jest.fn((arr: number[]) => Math.max(...arr.filter(n => !isNaN(n)))),
        min: jest.fn((arr: number[]) => Math.min(...arr.filter(n => !isNaN(n)))),
        sum: jest.fn((arr: any[], accessor?: (d: any) => number) => {
            if (accessor) {
                return arr.reduce((sum, d) => sum + accessor(d), 0);
            }
            return arr.reduce((sum, d) => sum + d, 0);
        }),
        schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        // Add color functions for ScribbleFillUtils
        color: jest.fn((colorString: string) => {
            // Mock d3.color function
            if (!colorString || typeof colorString !== 'string') return null;

            // Return a mock color object
            return {
                r: 255,
                g: 0,
                b: 0,
                opacity: 1,
                toString: () => colorString,
                hex: colorString,
                rgb: () => ({ r: 255, g: 0, b: 0 })
            };
        }),
        hsl: jest.fn((color: any) => {
            // Mock d3.hsl function
            return {
                h: 0,
                s: 0.5,
                l: 0.5,
                opacity: 1,
                toString: () => 'hsl(0, 50%, 50%)'
            };
        })
    };
});