import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ResizeHandleDirective } from './resize-handle.directive';
import { PanelSize } from '../models';

// Vitest imports
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Test host component to wrap ResizeHandleDirective
 * Provides the required Signal inputs and output handlers for testing
 */
@Component({
  standalone: true,
  imports: [ResizeHandleDirective],
  template: `
    <div
      [appResizeHandle]="size"
      [minSize]="minSize"
      [maxSize]="maxSize"
      (sizeChange)="onSizeChange($event)"
      (resizeStart)="onResizeStart()"
      (resizeEnd)="onResizeEnd()"
      class="resize-handle"
    >
      Resize me!
    </div>
  `,
})
class TestHostComponent {
  readonly size = signal<PanelSize>({ width: 400, height: 300 });
  minSize: PanelSize = { width: 300, height: 200 };
  maxSize: PanelSize = { width: 1200, height: 800 };

  sizeChanges: PanelSize[] = [];
  resizeStartCount = 0;
  resizeEndCount = 0;

  onSizeChange(newSize: PanelSize): void {
    this.sizeChanges.push(newSize);
  }

  onResizeStart(): void {
    this.resizeStartCount++;
  }

  onResizeEnd(): void {
    this.resizeEndCount++;
  }

  /**
   * Helper method to reset test state
   */
  resetTestState(): void {
    this.sizeChanges = [];
    this.resizeStartCount = 0;
    this.resizeEndCount = 0;
  }

  /**
   * Helper method to update size signal
   */
  updateSize(newSize: PanelSize): void {
    (this.size as unknown as { set: (value: PanelSize) => void }).set(newSize);
  }
}

describe('ResizeHandleDirective', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: ResizeHandleDirective;
  let resizeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

    // Get the directive instance
    fixture.detectChanges();
    directive = fixture.debugElement.children[0].injector.get(ResizeHandleDirective);
    resizeElement = fixture.nativeElement.querySelector('.resize-handle');
  });

  describe('Directive Initialization', () => {
    it('should create the directive', () => {
      expect(directive).toBeTruthy();
    });

    it('should have required inputs defined', () => {
      expect(directive.size).toBeDefined();
      expect(directive.size()).toEqual({ width: 400, height: 300 });
    });

    it('should have default min/max size constraints', () => {
      expect(directive.minSize).toEqual({ width: 300, height: 200 });
      expect(directive.maxSize).toEqual({ width: 1200, height: 800 });
    });

    it('should have output emitters defined', () => {
      expect(directive.sizeChange).toBeDefined();
      expect(directive.resizeStart).toBeDefined();
      expect(directive.resizeEnd).toBeDefined();
    });

    it('should initialize with isResizing as false', () => {
      expect(directive['isResizing']).toBe(false);
    });

    it('should create bound event handlers in ngOnInit', () => {
      expect(directive['boundMouseMove']).toBeDefined();
      expect(directive['boundMouseUp']).toBeDefined();
      expect(typeof directive['boundMouseMove']).toBe('function');
      expect(typeof directive['boundMouseUp']).toBe('function');
    });
  });

  describe('Mouse Event Handlers', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should start resize on left mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      resizeElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(directive['isResizing']).toBe(true);
      expect(testHost.resizeStartCount).toBe(1);
      expect(directive['startSize']).toEqual({ width: 400, height: 300 });
      expect(directive['startMousePosition']).toEqual({ x: 100, y: 200 });
    });

    it('should not start resize on right mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 2, clientX: 100, clientY: 200 });

      resizeElement.dispatchEvent(event);

      expect(directive['isResizing']).toBe(false);
      expect(testHost.resizeStartCount).toBe(0);
    });

    it('should not start resize on middle mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 1, clientX: 100, clientY: 200 });

      resizeElement.dispatchEvent(event);

      expect(directive['isResizing']).toBe(false);
      expect(testHost.resizeStartCount).toBe(0);
    });

    it('should update size during mousemove when resizing', async () => {
      // Start resize
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(testHost.resizeStartCount).toBe(1);

      // Move mouse (increase size by 50x50)
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges).toHaveLength(1);
      expect(testHost.sizeChanges[0]).toEqual({ width: 450, height: 350 });
    });

    it('should not update size during mousemove when not resizing', () => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      expect(testHost.sizeChanges).toHaveLength(0);
    });

    it('should end resize on mouseup', () => {
      // Start resize
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(directive['isResizing']).toBe(true);
      expect(testHost.resizeStartCount).toBe(1);

      // End resize
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(directive['isResizing']).toBe(false);
      expect(testHost.resizeEndCount).toBe(1);
    });

    it('should not end resize if not currently resizing', () => {
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(testHost.resizeEndCount).toBe(0);
    });
  });

  describe('Size Calculations', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should calculate size delta correctly for positive movement', async () => {
      // Start at (400, 300)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Move to (150, 250) - delta of (50, 50)
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 450, height: 350 });
    });

    it('should calculate size delta correctly for negative movement', async () => {
      // Start at (400, 300)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Move to (50, 150) - delta of (-50, -50)
      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 150 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 350, height: 250 });
    });

    it('should calculate size delta correctly for mixed movement', async () => {
      // Start at (400, 300)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Move to (120, 180) - delta of (+20, -20)
      const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 180 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 420, height: 280 });
    });

    it('should handle zero delta movement', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Move to same position
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 400, height: 300 });
    });

    it('should emit size changes for each mousemove', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // First move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Second move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Third move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges).toHaveLength(3);
      expect(testHost.sizeChanges[0]).toEqual({ width: 410, height: 310 });
      expect(testHost.sizeChanges[1]).toEqual({ width: 420, height: 320 });
      expect(testHost.sizeChanges[2]).toEqual({ width: 430, height: 330 });
    });

    it('should use current size signal value as start size', async () => {
      // Update initial size
      testHost.updateSize({ width: 800, height: 600 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(directive['startSize']).toEqual({ width: 800, height: 600 });

      // Move to (110, 210) - delta of (10, 10)
      const moveEvent = new MouseEvent('mousemove', { clientX: 110, clientY: 210 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // New size should be (800 + 10, 600 + 10) = (810, 610)
      expect(testHost.sizeChanges[0]).toEqual({ width: 810, height: 610 });
    });
  });

  describe('Size Constraints (min/max)', () => {
    beforeEach(() => {
      testHost.resetTestState();
      testHost.minSize = { width: 300, height: 200 };
      testHost.maxSize = { width: 1200, height: 800 };
    });

    it('should enforce minimum width constraint', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to shrink below min width (400 - 200 = 200, but min is 300)
      const moveEvent = new MouseEvent('mousemove', { clientX: -100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0].width).toBe(300); // Clamped to min
    });

    it('should enforce minimum height constraint', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to shrink below min height (300 - 200 = 100, but min is 200)
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 0 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0].height).toBe(200); // Clamped to min
    });

    it('should enforce maximum width constraint', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to grow beyond max width (400 + 1000 = 1400, but max is 1200)
      const moveEvent = new MouseEvent('mousemove', { clientX: 1100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0].width).toBe(1200); // Clamped to max
    });

    it('should enforce maximum height constraint', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to grow beyond max height (300 + 600 = 900, but max is 800)
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 800 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0].height).toBe(800); // Clamped to max
    });

    it('should enforce both min and max constraints simultaneously', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to shrink below both mins
      let moveEvent = new MouseEvent('mousemove', { clientX: -200, clientY: -200 });
      window.dispatchEvent(moveEvent);
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0].width).toBe(300);
      expect(testHost.sizeChanges[0].height).toBe(200);

      // Try to grow beyond both maxs
      moveEvent = new MouseEvent('mousemove', { clientX: 1500, clientY: 1000 });
      window.dispatchEvent(moveEvent);
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[1].width).toBe(1200);
      expect(testHost.sizeChanges[1].height).toBe(800);
    });

    it('should allow resizing at minimum boundary', async () => {
      // Start at min size
      testHost.updateSize({ width: 300, height: 200 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to shrink further (should stay at min)
      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 100 });
      window.dispatchEvent(moveEvent);
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 300, height: 200 });

      // Grow slightly (should work)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[1]).toEqual({ width: 350, height: 250 });
    });

    it('should allow resizing at maximum boundary', async () => {
      // Start at max size
      testHost.updateSize({ width: 1200, height: 800 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to grow further (should stay at max)
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 300 });
      window.dispatchEvent(moveEvent);
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 1200, height: 800 });

      // Shrink slightly (should work)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 100 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[1]).toEqual({ width: 1150, height: 700 });
    });
  });

  describe('Clamp Helper Function', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should return value when within bounds', () => {
      expect(directive['clamp'](500, 300, 1200)).toBe(500);
    });

    it('should return min when value is below min', () => {
      expect(directive['clamp'](200, 300, 1200)).toBe(300);
    });

    it('should return max when value is above max', () => {
      expect(directive['clamp'](1500, 300, 1200)).toBe(1200);
    });

    it('should return min when value equals min', () => {
      expect(directive['clamp'](300, 300, 1200)).toBe(300);
    });

    it('should return max when value equals max', () => {
      expect(directive['clamp'](1200, 300, 1200)).toBe(1200);
    });

    it('should handle negative values', () => {
      expect(directive['clamp'](-100, 300, 1200)).toBe(300);
    });

    it('should handle zero correctly', () => {
      expect(directive['clamp'](0, 300, 1200)).toBe(300);
    });
  });

  describe('Resize Lifecycle', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should emit resizeStart only once when resize begins', () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(testHost.resizeStartCount).toBe(1);

      // Additional mousemove should not emit resizeStart again
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      expect(testHost.resizeStartCount).toBe(1);
    });

    it('should emit resizeEnd only once when resize ends', () => {
      // Start resize
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // End resize
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.resizeEndCount).toBe(1);

      // Additional mouseup should not emit resizeEnd again
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.resizeEndCount).toBe(1);
    });

    it('should complete full resize lifecycle: start -> move -> end', async () => {
      // Start
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);
      expect(testHost.resizeStartCount).toBe(1);
      expect(testHost.resizeEndCount).toBe(0);

      // Move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.sizeChanges).toHaveLength(1);

      // End
      window.dispatchEvent(new MouseEvent('mouseup', {}));
      expect(testHost.resizeEndCount).toBe(1);

      // Verify full lifecycle
      expect(testHost.resizeStartCount).toBe(1);
      expect(testHost.resizeEndCount).toBe(1);
      expect(testHost.sizeChanges).toHaveLength(1);
    });

    it('should handle multiple complete resize sequences', async () => {
      // First resize
      let startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.resizeStartCount).toBe(1);
      expect(testHost.resizeEndCount).toBe(1);

      // Second resize
      startEvent = new MouseEvent('mousedown', { button: 0, clientX: 200, clientY: 300 });
      resizeElement.dispatchEvent(startEvent);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, clientY: 310 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.resizeStartCount).toBe(2);
      expect(testHost.resizeEndCount).toBe(2);
      expect(testHost.sizeChanges).toHaveLength(2);
    });
  });

  describe('Event Listener Management', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should add global listeners on resize start', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should remove global listeners on resize end', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Start resize
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // End resize
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should remove global listeners in ngOnDestroy if resizing', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Start resize but don't end it
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(directive['isResizing']).toBe(true);

      // Destroy directive
      directive.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should not attempt to remove listeners if not resizing on destroy', () => {
      // Use spyOn to track calls to removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const callCountBefore = removeEventListenerSpy.mock.calls.length;

      expect(directive['isResizing']).toBe(false);

      directive.ngOnDestroy();

      // Should not call removeEventListener since we never started resizing
      // Check that no new calls were made
      expect(removeEventListenerSpy.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should handle rapid clicks correctly', () => {
      // Rapid mousedown events
      for (let i = 0; i < 5; i++) {
        const event = new MouseEvent('mousedown', { button: 0, clientX: 100 + i * 10, clientY: 200 + i * 10 });
        resizeElement.dispatchEvent(event);
      }

      // Each mousedown should start a new resize
      expect(testHost.resizeStartCount).toBe(5);
    });

    it('should handle mousemove before mousedown gracefully', () => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      expect(directive['isResizing']).toBe(false);
      expect(testHost.sizeChanges).toHaveLength(0);
    });

    it('should handle mouseup before mousedown gracefully', () => {
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(directive['isResizing']).toBe(false);
      expect(testHost.resizeEndCount).toBe(0);
    });

    it('should prevent default on mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      resizeElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle boundary condition: single pixel movement', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: 101, clientY: 201 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 401, height: 301 });
    });

    it('should handle mousemove with same client position', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Move to same position - should still emit sizeChange
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges).toHaveLength(1);
      expect(testHost.sizeChanges[0]).toEqual({ width: 400, height: 300 });
    });

    it('should handle very large resize values', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: 10000, clientY: 10000 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should be clamped to max size
      expect(testHost.sizeChanges[0].width).toBeLessThanOrEqual(1200);
      expect(testHost.sizeChanges[0].height).toBeLessThanOrEqual(800);
    });

    it('should handle negative resize values', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: -1000, clientY: -1000 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should be clamped to min size
      expect(testHost.sizeChanges[0].width).toBeGreaterThanOrEqual(300);
      expect(testHost.sizeChanges[0].height).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should support typical resize workflow', async () => {
      // Initial size
      expect(testHost.size()).toEqual({ width: 400, height: 300 });

      // User clicks and drags the element
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Resize to larger size
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 350 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Release
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      // Verify workflow
      expect(testHost.resizeStartCount).toBe(1);
      expect(testHost.resizeEndCount).toBe(1);
      expect(testHost.sizeChanges).toHaveLength(2);
      expect(testHost.sizeChanges[0]).toEqual({ width: 500, height: 400 });
      expect(testHost.sizeChanges[1]).toEqual({ width: 550, height: 450 });
    });

    it('should support resize with constraint boundaries', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Shrink towards min
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 100 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Grow towards max
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1500, clientY: 1000 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.sizeChanges).toHaveLength(2);
      expect(testHost.sizeChanges[0].width).toBeGreaterThanOrEqual(300);
      expect(testHost.sizeChanges[0].height).toBeGreaterThanOrEqual(200);
      expect(testHost.sizeChanges[1].width).toBeLessThanOrEqual(1200);
      expect(testHost.sizeChanges[1].height).toBeLessThanOrEqual(800);
    });

    it('should handle interrupted resize (element destroyed during resize)', () => {
      // Start resize
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      expect(directive['isResizing']).toBe(true);

      // Simulate component destruction during resize
      directive.ngOnDestroy();

      // Should cleanup listeners
      expect(directive['isResizing']).toBe(true); // Still true, but listeners are removed

      // Mousemove should not trigger size change
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      expect(testHost.sizeChanges).toHaveLength(0);
    });
  });

  describe('requestAnimationFrame Throttling', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should throttle size updates using RAF', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Dispatch multiple mousemove events rapidly
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 140, clientY: 240 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));

      // Should not emit immediately due to RAF throttling
      expect(testHost.sizeChanges).toHaveLength(0);

      // Wait for next animation frame
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should emit once with the latest position
      expect(testHost.sizeChanges).toHaveLength(1);
      expect(testHost.sizeChanges[0]).toEqual({ width: 450, height: 350 });
    }, 10000);

    it('should cancel pending RAF on new mousemove', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // First mousemove
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      // Immediately second mousemove (should cancel first RAF)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));

      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should only emit once with the latest position
      expect(testHost.sizeChanges).toHaveLength(1);
      expect(testHost.sizeChanges[0]).toEqual({ width: 420, height: 320 });
    }, 10000);

    it('should handle multiple RAF cycles correctly', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // First resize cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.sizeChanges).toHaveLength(1);

      // Second resize cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.sizeChanges).toHaveLength(2);

      // Third resize cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.sizeChanges).toHaveLength(3);
    }, 10000);

    it('should cancel RAF on ngOnDestroy', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Trigger mousemove (schedules RAF)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      // Destroy before RAF completes
      directive.ngOnDestroy();

      // Wait longer than a frame
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not emit size change due to cleanup
      expect(testHost.sizeChanges).toHaveLength(0);
    }, 10000);
  });

  describe('Custom Min/Max Size Constraints', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should use custom min size from input', async () => {
      testHost.minSize = { width: 500, height: 400 };
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to shrink below custom min
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 500, height: 400 });
    });

    it('should use custom max size from input', async () => {
      testHost.maxSize = { width: 600, height: 500 };
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to grow beyond custom max
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 500 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.sizeChanges[0]).toEqual({ width: 600, height: 500 });
    });

    it('should handle min and max being the same (fixed size)', async () => {
      testHost.minSize = { width: 400, height: 300 };
      testHost.maxSize = { width: 400, height: 300 };
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      resizeElement.dispatchEvent(startEvent);

      // Try to resize
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should stay at fixed size
      expect(testHost.sizeChanges[0]).toEqual({ width: 400, height: 300 });
    });
  });
});
