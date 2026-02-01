/**
 * Streaming Markdown - Performance Monitor Service
 *
 * Phase 9, Task 9.1: Define Performance Metrics Interface
 *
 * This module provides performance tracking capabilities for the streaming markdown system.
 * It monitors rendering performance, memory usage, and provides metrics for optimization.
 *
 * @module StreamingMarkdown.Core
 */

import { Injectable } from '@angular/core';

/**
 * Performance metrics collected during markdown rendering.
 * Provides insights into the efficiency of the parsing and rendering pipeline.
 */
export interface PerformanceMetrics {
  /** Average time in milliseconds to render a single block */
  averageRenderTime: number;

  /** Total number of blocks processed */
  blockCount: number;

  /** Estimated memory usage in bytes (if available) */
  memoryUsage?: number;

  /** Total processing time for all blocks (optional derived metric) */
  totalRenderTime?: number;
}

/**
 * Performance snapshot captured at a specific point in time.
 * Used to track performance changes across multiple rendering cycles.
 */
export interface PerformanceSnapshot {
  /** Timestamp when snapshot was captured */
  timestamp: number;

  /** Number of blocks processed at this point */
  blockCount: number;

  /** Elapsed time since measurement started */
  elapsedTime: number;
}

/**
 * Interface for performance monitoring operations.
 * Provides methods to track, measure, and report performance metrics.
 */
export interface IPerformanceMonitor {
  /**
   * Start a new performance measurement session.
   * Resets any previous measurements and begins tracking.
   *
   * @example
   * ```typescript
   * monitor.startMeasure();
   * // ... perform rendering work ...
   * const metrics = monitor.endMeasure();
   * console.log(`Average render time: ${metrics.averageRenderTime}ms`);
   * ```
   */
  startMeasure(): void;

  /**
   * End the current measurement session and calculate metrics.
   * Computes averages and aggregates collected performance data.
   *
   * @returns PerformanceMetrics containing aggregated performance data
   *
   * @example
   * ```typescript
   * const metrics = monitor.endMeasure();
   * expect(metrics.averageRenderTime).toBeLessThan(16); // < 60fps
   * ```
   */
  endMeasure(): PerformanceMetrics;

  /**
   * Reset all performance tracking state.
   * Clears collected data and prepares for a new measurement session.
   *
   * @example
   * ```typescript
   * monitor.reset();
   * expect(monitor.isMeasuring()).toBe(false);
   * ```
   */
  reset(): void;

  /**
   * Record a single block render operation.
   * Called during the rendering process to track individual block performance.
   *
   * @param renderTime - Time taken to render this specific block (in milliseconds)
   *
   * @example
   * ```typescript
   * const start = performance.now();
   * renderBlock(block);
   * const duration = performance.now() - start;
   * monitor.recordBlock(duration);
   * ```
   */
  recordBlock(renderTime: number): void;

  /**
   * Check if a measurement session is currently active.
   *
   * @returns true if currently measuring, false otherwise
   */
  isMeasuring(): boolean;

  /**
   * Get current performance snapshot without ending measurement.
   * Useful for real-time performance monitoring.
   *
   * @returns PerformanceSnapshot with current metrics
   *
   * @example
   * ```typescript
   * const snapshot = monitor.getSnapshot();
   * console.log(`Processed ${snapshot.blockCount} blocks in ${snapshot.elapsedTime}ms`);
   * ```
   */
  getSnapshot(): PerformanceSnapshot;
}

/**
 * Implementation of the performance monitor service.
 *
 * Uses the Performance API (performance.now()) for high-precision timing.
 * Optionally tracks memory usage if the performance.memory API is available.
 *
 * Memory tracking is non-standard and only available in Chromium-based browsers
 * with specific flags enabled. This service gracefully degrades when unavailable.
 *
 * @example
 * ```typescript
 * // In component constructor
 * constructor(private monitor: PerformanceMonitor) {
 *   this.monitor.startMeasure();
 * }
 *
 * // After rendering
 * ngAfterViewChecked() {
 *   const metrics = this.monitor.endMeasure();
 *   this.performanceStats.set(metrics);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PerformanceMonitor implements IPerformanceMonitor {
  /** Start time of the current measurement session */
  private startTime: number = 0;

  /** Flag indicating if a measurement is in progress */
  private measuring: boolean = false;

  /** Array of individual block render times */
  private blockRenderTimes: number[] = [];

  /** Block counter for the current session */
  private blockCounter: number = 0;

  /** Memory usage at start of measurement (if available) */
  private startMemory?: number;

  /**
   * Start a new performance measurement session.
   * Initializes timing and optionally captures initial memory state.
   */
  startMeasure(): void {
    this.startTime = performance.now();
    this.measuring = true;
    this.blockRenderTimes = [];
    this.blockCounter = 0;

    // Capture initial memory if available (Chromium only)
    if (this.isMemoryAPIAvailable()) {
      this.startMemory = (performance as any).memory.usedJSHeapSize;
    }
  }

  /**
   * End measurement and compute aggregated metrics.
   *
   * Calculates:
   * - Average render time per block
   * - Total block count
   * - Total memory delta (if available)
   * - Total render time
   *
   * @returns PerformanceMetrics with aggregated statistics
   */
  endMeasure(): PerformanceMetrics {
    if (!this.measuring) {
      throw new Error('Cannot end measure: no active measurement session. Call startMeasure() first.');
    }

    const endTime = performance.now();
    const totalRenderTime = endTime - this.startTime;

    const metrics: PerformanceMetrics = {
      averageRenderTime: this.calculateAverageRenderTime(),
      blockCount: this.blockCounter,
      totalRenderTime
    };

    // Calculate memory usage if available
    if (this.isMemoryAPIAvailable() && this.startMemory !== undefined) {
      const endMemory = (performance as any).memory.usedJSHeapSize;
      metrics.memoryUsage = endMemory - this.startMemory;
    }

    this.measuring = false;
    return metrics;
  }

  /**
   * Reset all tracking state and prepare for a new session.
   */
  reset(): void {
    this.startTime = 0;
    this.measuring = false;
    this.blockRenderTimes = [];
    this.blockCounter = 0;
    this.startMemory = undefined;
  }

  /**
   * Record a block's render time.
   * Adds the timing data to the internal collection.
   *
   * @param renderTime - Time taken to render this block (in milliseconds)
   */
  recordBlock(renderTime: number): void {
    if (!this.measuring) {
      console.warn('PerformanceMonitor: recordBlock() called without active measurement');
      return;
    }

    this.blockRenderTimes.push(renderTime);
    this.blockCounter++;
  }

  /**
   * Check if a measurement session is currently active.
   *
   * @returns true if measuring, false otherwise
   */
  isMeasuring(): boolean {
    return this.measuring;
  }

  /**
   * Capture current performance snapshot.
   *
   * @returns PerformanceSnapshot with current state
   */
  getSnapshot(): PerformanceSnapshot {
    const currentTime = performance.now();

    return {
      timestamp: Date.now(),
      blockCount: this.blockCounter,
      elapsedTime: this.measuring ? currentTime - this.startTime : 0
    };
  }

  /**
   * Calculate average render time from collected samples.
   *
   * @private
   * @returns Average time in milliseconds
   */
  private calculateAverageRenderTime(): number {
    if (this.blockRenderTimes.length === 0) {
      return 0;
    }

    const sum = this.blockRenderTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.blockRenderTimes.length;
  }

  /**
   * Check if the performance.memory API is available.
   * Non-standard API available only in Chromium-based browsers.
   *
   * @private
   * @returns true if memory API is available
   */
  private isMemoryAPIAvailable(): boolean {
    return typeof performance !== 'undefined' &&
           'memory' in (performance as any) &&
           typeof (performance as any).memory.usedJSHeapSize === 'number';
  }
}
