# Handwritten Graph Library (TypeScript)

A modern TypeScript library for creating hand-drawn style charts inspired by comics and sketches. Built with D3.js and designed with type safety and excellent developer experience in mind.

## Features

- 🎨 **Hand-drawn/sketched visual style** - Authentic comic-book aesthetic
- 📊 **Multiple chart types** - Line graphs and pie charts with more coming
- 🔧 **TypeScript support** - Full type definitions and IntelliSense
- 🎯 **Multi-series support** - Handle complex datasets with ease
- 🎭 **Interactive tooltips** - Hover effects with detailed information
- 🎪 **Directional scribble fills** - Artistic fill patterns for pie charts
- 🎨 **Oil paint textures** - Rich watercolor-like effects
- ⚙️ **Highly configurable** - Extensive customization options
- 🧩 **Modern architecture** - Clean OOP design with proper separation of concerns

## Installation

```bash
npm install handwritten-graph
```

Or via CDN:

```html
<script src="https://unpkg.com/handwritten-graph@latest/dist/handwritten-graph.js"></script>
```

## Quick Start

### TypeScript/ES6 Modules

```typescript
import { LineChart, PieChart, LineChartData, PieChartData } from 'handwritten-graph';

// Line Chart
const lineData: LineChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Revenue",
      data: [65, 59, 80, 81, 56, 55],
      lineColor: "rgb(75, 192, 192)"
    },
    {
      label: "Expenses", 
      data: [30, 45, 51, 60, 48, 40],
      lineColor: "rgb(255, 99, 132)"
    }
  ]
};

const lineChart = new LineChart("#line-chart-container", lineData, {
  width: 800,
  height: 400,
  handDrawnEffect: true
});

// Pie Chart
const pieData: PieChartData = [
  { label: "Marketing", value: 30, color: "#FF6384" },
  { label: "Development", value: 45, color: "#36A2EB" },
  { label: "Research", value: 15, color: "#FFCE56" },
  { label: "Administration", value: 10, color: "#4BC0C0" }
];

const pieChart = new PieChart("#pie-chart-container", pieData, {
  useScribbleFill: true,
  fillStyle: 'directional'
});
```

### Legacy/JavaScript (Factory Functions)

```javascript
// Using factory functions for backward compatibility
const lineCleanup = HandwrittenGraph.createGraph("#graph-container", lineData, {
  width: 800,
  height: 400
});

const pieCleanup = HandwrittenGraph.createPieChart("#pie-container", pieData, {
  innerRadius: 80 // Creates a donut chart
});

// Clean up when done
lineCleanup();
pieCleanup();
```

## API Reference

### LineChart Class

```typescript
class LineChart {
  constructor(
    selector: string,
    data: LineChartData,
    config?: Partial<LineChartConfig>
  )
  
  destroy(): void
}
```

#### LineChartData Interface

```typescript
interface LineChartData {
  labels: string[];
  datasets: LineDataset[];
}

interface LineDataset {
  label: string;
  data: number[];
  lineColor?: string;
  jitter?: number;
}
```

#### LineChartConfig Interface

```typescript
interface LineChartConfig extends BaseChartConfig {
  lineColor?: string;
  pointRadius?: number;
  gridColor?: string;
  handDrawnPoints?: number;
  legendBorder?: boolean;
  valueFormat?: (value: number) => string;
}
```

### PieChart Class

```typescript
class PieChart {
  constructor(
    selector: string,
    data: PieChartData,
    config?: Partial<PieChartConfig>
  )
  
  destroy(): void
}
```

#### PieChartData Interface

```typescript
interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

type PieChartData = PieChartDataItem[];
```

#### PieChartConfig Interface

```typescript
interface PieChartConfig extends BaseChartConfig {
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  legendBorder?: boolean;
  valueFormat?: (value: number) => string;
  useScribbleFill?: boolean;
  fillStyle?: 'directional' | 'oilpaint';
}
```

### Base Configuration

```typescript
interface BaseChartConfig {
  width?: number;
  height?: number;
  margin?: Partial<ChartMargin>;
  fontFamily?: string;
  handDrawnEffect?: boolean;
  handDrawnJitter?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  tooltipBgColor?: string;
  tooltipTextColor?: string;
  tooltipBorderColor?: string;
  tooltipBorderWidth?: number;
  tooltipBorderRadius?: number;
  tooltipOpacity?: number;
}
```

## Advanced Examples

### Custom Styling

```typescript
const customChart = new LineChart("#custom-chart", data, {
  width: 1000,
  height: 600,
  margin: { top: 20, right: 100, bottom: 50, left: 80 },
  handDrawnEffect: true,
  handDrawnJitter: 3,
  gridColor: '#f0f0f0',
  fontFamily: 'Comic Sans MS',
  tooltipBgColor: '#fffef7',
  tooltipBorderColor: '#8B4513',
  legendBorder: true
});
```

### Oil Paint Effect Pie Chart

```typescript
const artisticPie = new PieChart("#artistic-pie", data, {
  useScribbleFill: true,
  fillStyle: 'oilpaint',
  handDrawnJitter: 2.5,
  cornerRadius: 5,
  padAngle: 0.05
});
```

### Donut Chart with Custom Formatting

```typescript
const donutChart = new PieChart("#donut-chart", data, {
  innerRadius: 100,
  valueFormat: (value) => `$${value.toLocaleString()}`,
  legendBorder: false,
  handDrawnEffect: false // Clean, geometric look
});
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Development

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch

# Production build
npm run build
```

## Architecture

The library follows modern TypeScript patterns:

- **Object-Oriented Design**: Charts are classes with proper encapsulation
- **Type Safety**: Full TypeScript definitions with strict typing
- **Composition**: Modular utilities and components
- **Inheritance**: Base chart class with shared functionality
- **Factory Pattern**: Backward-compatible factory functions
- **Strategy Pattern**: Pluggable fill styles and effects

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0

- Complete TypeScript rewrite from [handwritten-graph](https://github.com/Lilanga/handwritten-graph)
- Modern class-based architecture

### v1.0.1

- Enhanced type definitions
- Improved performance
- Better error handling

### V1.0.2

- Text elements with proper SVG property handling
- Axes and grid styling
- Line chart elements
- Pie chart elements
- Legend and Tooltip styling
- Hand-drawn effects
- Responsive design
- Print styles

### V1.0.3

- Comprehensive test suite
- Test Setup with D3 mocks
- Example html to preview built lib

### V1.0.4

- Update test suite
- Add test coverage
- Type check scripts
- Type definition publish support
