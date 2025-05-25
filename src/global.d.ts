// Global type declarations for UMD build
import { HandwrittenGraphNamespace } from './types';

declare global {
    interface Window {
        HandwrittenGraph: HandwrittenGraphNamespace;
    }
}

// UMD module declaration
declare const HandwrittenGraph: HandwrittenGraphNamespace;

export = HandwrittenGraph;
export as namespace HandwrittenGraph;