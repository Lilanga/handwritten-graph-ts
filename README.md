# Handwritten Graph Library (TypeScript)

A modern TypeScript library for creating hand-drawn style charts inspired by comics and sketches. Built with D3.js and designed with type safety and excellent developer experience in mind.

## Documentation

**[Complete API Documentation](https://handwritten-graph-docs.readthedocs.io/en/latest/)**

[📚 Live Demo](https://p7wc4d.csb.app) | [📖 Quick Start](https://handwritten-graph-docs.readthedocs.io/en/latest/quick-start.html)

## Features

- 🎨 **Hand-drawn/sketched visual style** - Authentic comic-book aesthetic
- 📊 **Multiple chart types** - Line graphs, bar charts, and pie charts
- 🔧 **TypeScript support** - Full type definitions and IntelliSense
- 🎯 **Multi-series support** - Handle complex datasets with ease
- 🎭 **Interactive tooltips** - Hover effects with detailed information
- 🎪 **Directional scribble fills** - Artistic fill patterns for charts
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
import { LineChart, BarChart, PieChart } from 'handwritten-graph';

// Sample data that can be reused across chart types
const chartData = {
  labels: ["Q1", "Q2", "Q3", "Q4"],
  datasets: [
    {
      label: "Revenue",
      data: [65, 59, 80, 81],
      lineColor: "rgb(75, 192, 192)", // For LineChart
      barColor: "#36A2EB" // For BarChart
    }
  ]
};

// Line Chart with Area Fill
const lineChart = new LineChart("#line-chart-container", chartData, {
  showArea: true,
  useScribbleFill: true
});

// Bar Chart (Vertical)
const barChart = new BarChart("#bar-chart-container", chartData, {
  orientation: 'vertical',
  showValues: true
});

// Horizontal Bar Chart
const horizontalBarChart = new BarChart("#horizontal-bar-container", chartData, {
  orientation: 'horizontal'
});

// Pie Chart
const pieData = [
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
const lineCleanup = HandwrittenGraph.createGraph("#graph-container", chartData);
const barCleanup = HandwrittenGraph.createBarChart("#bar-container", chartData);
const pieCleanup = HandwrittenGraph.createPieChart("#pie-container", pieData);

// Clean up when done
lineCleanup();
barCleanup();
pieCleanup();
```

## API Reference

### Chart Classes

```typescript
// Line Chart
new LineChart(selector: string, data: LineChartData, config?: Partial)

// Bar Chart  
new BarChart(selector: string, data: BarChartData, config?: Partial)

// Pie Chart
new PieChart(selector: string, data: PieChartData, config?: Partial)
```

### Key Configuration Options

```typescript
interface BaseChartConfig {
  width?: number;
  height?: number;
  handDrawnEffect?: boolean;
  useScribbleFill?: boolean; // Enable artistic fill patterns
  fillStyle?: 'directional' | 'oilpaint'; // Fill pattern style
}

// LineChart specific
interface LineChartConfig extends BaseChartConfig {
  showArea?: boolean; // Enable area fill under lines
  pointRadius?: number;
  lineColor?: string;
}

// BarChart specific  
interface BarChartConfig extends BaseChartConfig {
  orientation?: 'vertical' | 'horizontal'; // Chart orientation
  showValues?: boolean; // Show value labels on bars
  barSpacing?: number;
  groupSpacing?: number;
}

// PieChart specific
interface PieChartConfig extends BaseChartConfig {
  innerRadius?: number; // For donut charts
  legendBorder?: boolean;
}
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

# Production build
npm run build

# Testing
npm run test
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

### v1.0.5

- **NEW**: BarChart support with vertical and horizontal orientations
- **NEW**: Area fill support for LineCharts with `showArea` option
- **NEW**: Multi-series support for BarCharts
- **NEW**: Value labels on bar charts with `showValues` option
- **ENHANCED**: Improved scribble fill patterns for all chart types
- **ENHANCED**: Better responsive design and styling
- **ENHANCED**: Seamless pie chart borders matching slice colors

### v1.0.4

- Update test suite
- Add test coverage
- Type check scripts
- Type definition publish support

### v1.0.3

- Comprehensive test suite
- Test Setup with D3 mocks
- Example html to preview built lib

### v1.0.2

- Text elements with proper SVG property handling
- Axes and grid styling
- Line chart elements
- Pie chart elements
- Legend and Tooltip styling
- Hand-drawn effects
- Responsive design
- Print styles

### v1.0.1

- Enhanced type definitions
- Improved performance
- Better error handling

### v1.0.0

- Complete TypeScript rewrite from [handwritten-graph](https://github.com/Lilanga/handwritten-graph)
- Modern class-based architecture
