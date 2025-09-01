import * as d3 from 'd3';

interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
}

interface HapticFeedbackConfig {
    enabled: boolean;
    intensity: 'light' | 'medium' | 'heavy';
}

interface AccessibilityConfig {
    announceChanges: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
}

// Enhanced UX utilities for natural chart interactions and accessibility
export class UXEnhancementUtils {
    private static readonly DEFAULT_ANIMATION: AnimationConfig = {
        duration: 300,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Natural easing
        delay: 0
    };

    // Create natural hover animations that feel organic
    static createNaturalHoverEffect(
        selection: d3.Selection<any, any, any, any>,
        config: Partial<AnimationConfig> = {}
    ): void {
        const animConfig = { ...this.DEFAULT_ANIMATION, ...config };
        
        selection
            .on('mouseenter', function(event, d) {
                const element = d3.select(this);
                
                // Add subtle shadow for depth
                element.style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))');
                
                // Gentle scale with slight rotation for natural feel
                const randomRotation = (Math.random() - 0.5) * 2; // ±1 degree
                element
                    .transition()
                    .duration(animConfig.duration)
                    .ease(d3.easeCubicOut)
                    .style('transform', `scale(1.05) rotate(${randomRotation}deg)`)
                    .style('opacity', 0.9);
                    
                // Add gentle pulsing animation
                element
                    .transition()
                    .duration(animConfig.duration * 2)
                    .style('stroke-width', function() {
                        const current = d3.select(this).style('stroke-width') || '2';
                        return `${parseFloat(current) + 1}px`;
                    });
            })
            .on('mouseleave', function(event, d) {
                const element = d3.select(this);
                
                element
                    .transition()
                    .duration(animConfig.duration * 1.2) // Slightly slower return
                    .ease(d3.easeCubicInOut)
                    .style('transform', 'scale(1) rotate(0deg)')
                    .style('opacity', 1)
                    .style('filter', 'none')
                    .style('stroke-width', function() {
                        const current = d3.select(this).style('stroke-width') || '3';
                        return `${Math.max(1, parseFloat(current) - 1)}px`;
                    });
            });
    }

    // Create staggered reveal animation for chart elements
    static createStaggeredReveal(
        selection: d3.Selection<any, any, any, any>,
        baseDelay: number = 50
    ): void {
        selection.each(function(d, i) {
            const element = d3.select(this);
            const naturalDelay = baseDelay * i + Math.random() * baseDelay * 0.5; // Add randomness
            
            // Start hidden
            element
                .style('opacity', 0)
                .style('transform', 'translateY(10px) scale(0.95)');
            
            // Animate in with natural timing
            element
                .transition()
                .delay(naturalDelay)
                .duration(400 + Math.random() * 200) // Varied duration
                .ease(d3.easeCubicOut)
                .style('opacity', 1)
                .style('transform', 'translateY(0px) scale(1)');
        });
    }

    // Add natural drawing animation that simulates hand-drawing
    static createDrawingAnimation(
        pathSelection: d3.Selection<SVGPathElement, any, any, any>,
        duration: number = 1500
    ): void {
        pathSelection.each(function() {
            const path = d3.select(this);
            const pathElement = this as SVGPathElement;
            const totalLength = pathElement.getTotalLength();
            
            // Set up the starting position
            path
                .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
                .attr('stroke-dashoffset', totalLength)
                .style('opacity', 0.7); // Slightly transparent during drawing
            
            // Add slight hand tremor effect
            const tremor = 0.5;
            path.style('filter', `url(#hand-tremor-${Math.random().toString(36).substr(2, 9)})`);
            
            // Animate the drawing
            path
                .transition()
                .duration(duration + Math.random() * 300) // Natural variation
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .style('opacity', 1)
                .on('end', function() {
                    // Clean up
                    d3.select(this)
                        .attr('stroke-dasharray', null)
                        .style('filter', null);
                });
        });
    }

    // Create accessible focus indicators
    static addAccessibleFocus(
        selection: d3.Selection<any, any, any, any>,
        config: Partial<AccessibilityConfig> = {}
    ): void {
        const accessConfig = {
            announceChanges: true,
            keyboardNavigation: true,
            highContrast: false,
            reducedMotion: false,
            ...config
        };

        selection
            .attr('tabindex', 0) // Make focusable
            .attr('role', 'button')
            .on('focus', function(event, d) {
                const element = d3.select(this);
                
                // High-contrast focus indicator
                element
                    .style('outline', '2px solid #005fcc')
                    .style('outline-offset', '2px');
                
                // Announce to screen readers
                if (accessConfig.announceChanges) {
                    const label = element.attr('aria-label') || 'Chart element focused';
                    this.setAttribute('aria-live', 'polite');
                    this.setAttribute('aria-atomic', 'true');
                }
                
                // Subtle animation if motion is allowed
                if (!accessConfig.reducedMotion) {
                    element
                        .transition()
                        .duration(200)
                        .style('transform', 'scale(1.02)');
                }
            })
            .on('blur', function() {
                const element = d3.select(this);
                element
                    .style('outline', null)
                    .style('outline-offset', null);
                    
                if (!accessConfig.reducedMotion) {
                    element
                        .transition()
                        .duration(200)
                        .style('transform', 'scale(1)');
                }
            });
    }

    // Create natural color transitions for better UX
    static createColorTransition(
        selection: d3.Selection<any, any, any, any>,
        fromColor: string,
        toColor: string,
        duration: number = 300
    ): void {
        // Use LAB color space for more natural color transitions
        const interpolator = d3.interpolateLab(fromColor, toColor);
        
        selection
            .transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .tween('color', function() {
                return function(t: number) {
                    d3.select(this).style('fill', interpolator(t));
                };
            });
    }

    // Add haptic feedback simulation through visual/audio cues
    static simulateHapticFeedback(
        element: SVGElement | HTMLElement,
        config: HapticFeedbackConfig = { enabled: true, intensity: 'light' }
    ): void {
        if (!config.enabled) return;
        
        const selection = d3.select(element);
        const intensityMap = {
            light: { scale: 1.01, duration: 100 },
            medium: { scale: 1.02, duration: 150 },
            heavy: { scale: 1.04, duration: 200 }
        };
        
        const settings = intensityMap[config.intensity];
        
        // Visual haptic feedback through micro-animations
        selection
            .transition()
            .duration(settings.duration)
            .ease(d3.easeBounceOut)
            .style('transform', `scale(${settings.scale})`)
            .transition()
            .duration(settings.duration)
            .ease(d3.easeElasticOut)
            .style('transform', 'scale(1)');
        
        // Audio haptic feedback (if Web Audio API is available)
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            this.playTactileSound(config.intensity);
        }
    }

    // Create natural tooltip positioning that avoids screen edges
    static positionTooltipNaturally(
        tooltip: d3.Selection<any, any, any, any>,
        mouseX: number,
        mouseY: number,
        chartWidth: number,
        chartHeight: number
    ): { x: number; y: number } {
        const tooltipNode = tooltip.node() as HTMLElement;
        if (!tooltipNode) return { x: mouseX, y: mouseY };
        
        const rect = tooltipNode.getBoundingClientRect();
        const padding = 15; // Natural distance from cursor
        
        let x = mouseX + padding;
        let y = mouseY - rect.height - padding;
        
        // Avoid right edge
        if (x + rect.width > chartWidth) {
            x = mouseX - rect.width - padding;
        }
        
        // Avoid top edge
        if (y < 0) {
            y = mouseY + padding;
        }
        
        // Avoid bottom edge
        if (y + rect.height > chartHeight) {
            y = chartHeight - rect.height - padding;
        }
        
        // Add subtle random offset for natural feel
        x += (Math.random() - 0.5) * 4;
        y += (Math.random() - 0.5) * 4;
        
        return { x: Math.max(0, x), y: Math.max(0, y) };
    }

    // Detect user preferences for reduced motion
    static respectsReducedMotion(): boolean {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    }

    // Detect high contrast preference
    static respectsHighContrast(): boolean {
        return window.matchMedia?.('(prefers-contrast: high)')?.matches ?? false;
    }

    // Play subtle audio feedback for tactile simulation
    private static playTactileSound(intensity: 'light' | 'medium' | 'heavy'): void {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            // Frequency and volume based on intensity
            const settings = {
                light: { frequency: 800, volume: 0.02, duration: 50 },
                medium: { frequency: 600, volume: 0.04, duration: 80 },
                heavy: { frequency: 400, volume: 0.06, duration: 120 }
            };
            
            const config = settings[intensity];
            oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);
            gainNode.gain.setValueAtTime(config.volume, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + config.duration / 1000);
            
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + config.duration / 1000);
            
        } catch (error) {
            // Silent fail if audio not available
            console.debug('Audio context not available for haptic feedback');
        }
    }

    // Create natural entrance animations for chart components
    static createEntranceAnimation(
        selection: d3.Selection<any, any, any, any>,
        animationType: 'fadeIn' | 'slideUp' | 'scaleIn' | 'drawIn' = 'fadeIn',
        delay: number = 0
    ): void {
        const reducedMotion = this.respectsReducedMotion();
        
        if (reducedMotion) {
            // Simple fade for reduced motion preference
            selection.style('opacity', 0)
                .transition()
                .delay(delay)
                .duration(200)
                .style('opacity', 1);
            return;
        }
        
        switch (animationType) {
            case 'fadeIn':
                selection.style('opacity', 0)
                    .transition()
                    .delay(delay)
                    .duration(400)
                    .ease(d3.easeCubicOut)
                    .style('opacity', 1);
                break;
                
            case 'slideUp':
                selection
                    .style('opacity', 0)
                    .style('transform', 'translateY(20px)')
                    .transition()
                    .delay(delay)
                    .duration(500)
                    .ease(d3.easeCubicOut)
                    .style('opacity', 1)
                    .style('transform', 'translateY(0px)');
                break;
                
            case 'scaleIn':
                selection
                    .style('opacity', 0)
                    .style('transform', 'scale(0.8)')
                    .transition()
                    .delay(delay)
                    .duration(400)
                    .ease(d3.easeBackOut.overshoot(1.2))
                    .style('opacity', 1)
                    .style('transform', 'scale(1)');
                break;
                
            case 'drawIn':
                if (selection.node() instanceof SVGPathElement) {
                    this.createDrawingAnimation(selection, 800 + delay);
                } else {
                    // Fallback to scale animation
                    this.createEntranceAnimation(selection, 'scaleIn', delay);
                }
                break;
        }
    }
}