import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DragHandleDirective } from './drag-handle.directive';
import { PanelPosition } from '../models';

// Vitest imports
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Test host component to wrap DragHandleDirective
 * Provides the required Signal inputs and output handlers for testing
 */
@Component({
  standalone: true,
  imports: [DragHandleDirective],
  template: `
    <div
      [appDragHandle]="position"
      (positionChange)="onPositionChange($event)"
      (dragStart)="onDragStart()"
      (dragEnd)="onDragEnd()"
      class="drag-handle"
    >
      Drag me!
    </div>
  `,
})
class TestHostComponent {
  readonly position = signal<PanelPosition>({ x: 100, y: 200 });

  positionChanges: PanelPosition[] = [];
  dragStartCount = 0;
  dragEndCount = 0;

  onPositionChange(newPosition: PanelPosition): void {
    this.positionChanges.push(newPosition);
  }

  onDragStart(): void {
    this.dragStartCount++;
  }

  onDragEnd(): void {
    this.dragEndCount++;
  }

  /**
   * Helper method to reset test state
   */
  resetTestState(): void {
    this.positionChanges = [];
    this.dragStartCount = 0;
    this.dragEndCount = 0;
  }

  /**
   * Helper method to update position signal
   */
  updatePosition(newPosition: PanelPosition): void {
    (this.position as unknown as { set: (value: PanelPosition) => void }).set(newPosition);
  }
}

describe('DragHandleDirective', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: DragHandleDirective;
  let dragElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

    // Get the directive instance
    fixture.detectChanges();
    directive = fixture.debugElement.children[0].injector.get(DragHandleDirective);
    dragElement = fixture.nativeElement.querySelector('.drag-handle');
  });

  describe('Directive Initialization', () => {
    it('should create the directive', () => {
      expect(directive).toBeTruthy();
    });

    it('should have required inputs defined', () => {
      expect(directive.position).toBeDefined();
      expect(directive.position()).toEqual({ x: 100, y: 200 });
    });

    it('should have output emitters defined', () => {
      expect(directive.positionChange).toBeDefined();
      expect(directive.dragStart).toBeDefined();
      expect(directive.dragEnd).toBeDefined();
    });

    it('should initialize with isDragging as false', () => {
      expect(directive['isDragging']).toBe(false);
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

    it('should start drag on left mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      dragElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(directive['isDragging']).toBe(true);
      expect(testHost.dragStartCount).toBe(1);
      expect(directive['startPosition']).toEqual({ x: 100, y: 200 });
      expect(directive['startMousePosition']).toEqual({ x: 100, y: 200 });
    });

    it('should not start drag on right mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 2, clientX: 100, clientY: 200 });

      dragElement.dispatchEvent(event);

      expect(directive['isDragging']).toBe(false);
      expect(testHost.dragStartCount).toBe(0);
    });

    it('should not start drag on middle mouse button mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 1, clientX: 100, clientY: 200 });

      dragElement.dispatchEvent(event);

      expect(directive['isDragging']).toBe(false);
      expect(testHost.dragStartCount).toBe(0);
    });

    it('should update position during mousemove when dragging', async () => {
      // Start drag
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(testHost.dragStartCount).toBe(1);

      // Move mouse
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges).toHaveLength(1);
      expect(testHost.positionChanges[0]).toEqual({ x: 150, y: 250 });
    });

    it('should not update position during mousemove when not dragging', () => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      expect(testHost.positionChanges).toHaveLength(0);
    });

    it('should end drag on mouseup', () => {
      // Start drag
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['isDragging']).toBe(true);
      expect(testHost.dragStartCount).toBe(1);

      // End drag
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(directive['isDragging']).toBe(false);
      expect(testHost.dragEndCount).toBe(1);
    });

    it('should not end drag if not currently dragging', () => {
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(testHost.dragEndCount).toBe(0);
    });
  });

  describe('Position Calculations', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should calculate position delta correctly for positive movement', async () => {
      // Start at (100, 200)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Move to (150, 250) - delta of (50, 50)
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 150, y: 250 });
    });

    it('should calculate position delta correctly for negative movement', async () => {
      // Start at (100, 200)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Move to (50, 150) - delta of (-50, -50)
      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 150 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 50, y: 150 });
    });

    it('should calculate position delta correctly for mixed movement', async () => {
      // Start at (100, 200)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Move to (120, 180) - delta of (+20, -20)
      const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 180 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 120, y: 180 });
    });

    it('should handle zero delta movement', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Move to same position
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 100, y: 200 });
    });

    it('should emit position changes for each mousemove', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // First move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Second move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Third move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges).toHaveLength(3);
      expect(testHost.positionChanges[0]).toEqual({ x: 110, y: 210 });
      expect(testHost.positionChanges[1]).toEqual({ x: 120, y: 220 });
      expect(testHost.positionChanges[2]).toEqual({ x: 130, y: 230 });
    });

    it('should use current position signal value as start position', async () => {
      // Update initial position
      testHost.updatePosition({ x: 500, y: 600 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['startPosition']).toEqual({ x: 500, y: 600 });

      // Move to (110, 210) - delta of (10, 10)
      const moveEvent = new MouseEvent('mousemove', { clientX: 110, clientY: 210 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // New position should be (500 + 10, 600 + 10) = (510, 610)
      expect(testHost.positionChanges[0]).toEqual({ x: 510, y: 610 });
    });
  });

  describe('Drag Lifecycle', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should emit dragStart only once when drag begins', () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(testHost.dragStartCount).toBe(1);

      // Additional mousemove should not emit dragStart again
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      expect(testHost.dragStartCount).toBe(1);
    });

    it('should emit dragEnd only once when drag ends', () => {
      // Start drag
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // End drag
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.dragEndCount).toBe(1);

      // Additional mouseup should not emit dragEnd again
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.dragEndCount).toBe(1);
    });

    it('should complete full drag lifecycle: start -> move -> end', async () => {
      // Start
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);
      expect(testHost.dragStartCount).toBe(1);
      expect(testHost.dragEndCount).toBe(0);

      // Move
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.positionChanges).toHaveLength(1);

      // End
      window.dispatchEvent(new MouseEvent('mouseup', {}));
      expect(testHost.dragEndCount).toBe(1);

      // Verify full lifecycle
      expect(testHost.dragStartCount).toBe(1);
      expect(testHost.dragEndCount).toBe(1);
      expect(testHost.positionChanges).toHaveLength(1);
    });

    it('should handle multiple complete drag sequences', async () => {
      // First drag
      let startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.dragStartCount).toBe(1);
      expect(testHost.dragEndCount).toBe(1);

      // Second drag
      startEvent = new MouseEvent('mousedown', { button: 0, clientX: 200, clientY: 300 });
      dragElement.dispatchEvent(startEvent);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, clientY: 310 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.dragStartCount).toBe(2);
      expect(testHost.dragEndCount).toBe(2);
      expect(testHost.positionChanges).toHaveLength(2);
    });
  });

  describe('Event Listener Management', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should add global listeners on drag start', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should remove global listeners on drag end', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Start drag
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // End drag
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should remove global listeners in ngOnDestroy if dragging', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Start drag but don't end it
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['isDragging']).toBe(true);

      // Destroy directive
      directive.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', directive['boundMouseMove']);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', directive['boundMouseUp']);
    });

    it('should not attempt to remove listeners if not dragging on destroy', () => {
      // Use spyOn to track calls to removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const callCountBefore = removeEventListenerSpy.mock.calls.length;

      expect(directive['isDragging']).toBe(false);

      directive.ngOnDestroy();

      // Should not call removeEventListener since we never started dragging
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
        dragElement.dispatchEvent(event);
      }

      // Each mousedown should start a new drag
      expect(testHost.dragStartCount).toBe(5);
    });

    it('should handle mousemove before mousedown gracefully', () => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      window.dispatchEvent(moveEvent);

      expect(directive['isDragging']).toBe(false);
      expect(testHost.positionChanges).toHaveLength(0);
    });

    it('should handle mouseup before mousedown gracefully', () => {
      const upEvent = new MouseEvent('mouseup', {});
      window.dispatchEvent(upEvent);

      expect(directive['isDragging']).toBe(false);
      expect(testHost.dragEndCount).toBe(0);
    });

    it('should handle negative coordinates', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 });
      dragElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: -50, clientY: -100 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Initial position is (100, 200), moved by (-50, -100) = (50, 100)
      // BUT will be constrained to x: 50, y: 100 (no constraint needed for this case)
      expect(testHost.positionChanges[0].x).toBe(50);
      expect(testHost.positionChanges[0].y).toBe(100);
    });

    it('should handle very large coordinate values', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 });
      dragElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: 10000, clientY: 10000 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Initial position is (100, 200), moved by (10000, 10000)
      // Will be constrained to viewport boundaries
      expect(testHost.positionChanges[0].x).toBeGreaterThan(0);
      expect(testHost.positionChanges[0].y).toBeGreaterThan(0);
    });

    it('should handle starting position with negative values', async () => {
      testHost.updatePosition({ x: -100, y: -200 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['startPosition']).toEqual({ x: -100, y: -200 });

      const moveEvent = new MouseEvent('mousemove', { clientX: 50, clientY: 50 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // New position should be constrained to >= 0
      expect(testHost.positionChanges[0].x).toBeGreaterThanOrEqual(0);
      expect(testHost.positionChanges[0].y).toBeGreaterThanOrEqual(0);
    });

    it('should handle position signal with zero values', async () => {
      testHost.updatePosition({ x: 0, y: 0 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['startPosition']).toEqual({ x: 0, y: 0 });

      const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 50, y: 50 });
    });

    it('should prevent default on mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      dragElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle boundary condition: single pixel movement', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      const moveEvent = new MouseEvent('mousemove', { clientX: 101, clientY: 201 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges[0]).toEqual({ x: 101, y: 201 });
    });

    it('should handle mousemove with same client position', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Move to same position - should still emit positionChange
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(testHost.positionChanges).toHaveLength(1);
      expect(testHost.positionChanges[0]).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should support typical drag workflow', async () => {
      // Initial position
      expect(testHost.position()).toEqual({ x: 100, y: 200 });

      // User clicks and drags the element
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Drag to new position
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 350 }));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Release
      window.dispatchEvent(new MouseEvent('mouseup', {}));

      // Verify workflow
      expect(testHost.dragStartCount).toBe(1);
      expect(testHost.dragEndCount).toBe(1);
      expect(testHost.positionChanges).toHaveLength(2);
      expect(testHost.positionChanges[0]).toEqual({ x: 200, y: 300 });
      expect(testHost.positionChanges[1]).toEqual({ x: 250, y: 350 });
    });

    it('should support dragging across screen boundaries', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 });
      dragElement.dispatchEvent(startEvent);

      // Simulate dragging across screen
      const movements = [
        { x: 100, y: 100 },
        { x: 500, y: 100 },
        { x: 500, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ];

      for (const pos of movements) {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: pos.x, clientY: pos.y }));
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      window.dispatchEvent(new MouseEvent('mouseup', {}));

      expect(testHost.positionChanges).toHaveLength(5);
      expect(testHost.positionChanges[4]).toEqual({ x: 150, y: 250 });
    });

    it('should handle interrupted drag (element destroyed during drag)', () => {
      // Start drag
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      expect(directive['isDragging']).toBe(true);

      // Simulate component destruction during drag
      directive.ngOnDestroy();

      // Should cleanup listeners
      expect(directive['isDragging']).toBe(true); // Still true, but listeners are removed

      // Mousemove should not trigger position change
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      expect(testHost.positionChanges).toHaveLength(0);
    });
  });

  describe('Viewport Boundary Constraints', () => {
    beforeEach(() => {
      testHost.resetTestState();
      // Mock window dimensions
      vi.stubGlobal('innerWidth', 1920);
      vi.stubGlobal('innerHeight', 1080);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should constrain position to left boundary (x >= 0)', async () => {
      // Start at position (100, 200)
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Try to drag far left (would result in x: -200 without constraints)
      const moveEvent = new MouseEvent('mousemove', { clientX: -100, clientY: 200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Position should be constrained to x: 0
      expect(testHost.positionChanges[0].x).toBeGreaterThanOrEqual(0);
      expect(testHost.positionChanges[0].x).toBe(0);
    });

    it('should constrain position to top boundary (y >= 0)', async () => {
      testHost.updatePosition({ x: 100, y: 100 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 });
      dragElement.dispatchEvent(startEvent);

      // Try to drag far up (would result in y: -200 without constraints)
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: -100 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Position should be constrained to y: 0
      expect(testHost.positionChanges[0].y).toBeGreaterThanOrEqual(0);
      expect(testHost.positionChanges[0].y).toBe(0);
    });

    it('should constrain position to right boundary', async () => {
      testHost.updatePosition({ x: 1800, y: 500 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 1800, clientY: 500 });
      dragElement.dispatchEvent(startEvent);

      // Try to drag far right (would exceed viewport width)
      const moveEvent = new MouseEvent('mousemove', { clientX: 2000, clientY: 500 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Position should be constrained: window.innerWidth - 100 = 1820
      expect(testHost.positionChanges[0].x).toBeLessThanOrEqual(1920 - 100);
    });

    it('should constrain position to bottom boundary', async () => {
      testHost.updatePosition({ x: 500, y: 1000 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 500, clientY: 1000 });
      dragElement.dispatchEvent(startEvent);

      // Try to drag far down (would exceed viewport height)
      const moveEvent = new MouseEvent('mousemove', { clientX: 500, clientY: 1200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Position should be constrained: window.innerHeight - 100 = 980
      expect(testHost.positionChanges[0].y).toBeLessThanOrEqual(1080 - 100);
    });

    it('should keep at least 100px visible on all sides', async () => {
      // Start near edge
      testHost.updatePosition({ x: 50, y: 50 });
      fixture.detectChanges();

      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 });
      dragElement.dispatchEvent(startEvent);

      // Try to drag off-screen left and top
      const moveEvent = new MouseEvent('mousemove', { clientX: -200, clientY: -200 });
      window.dispatchEvent(moveEvent);

      // Wait for RAF to complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should be constrained to keep 100px visible
      expect(testHost.positionChanges[0].x).toBeGreaterThanOrEqual(0);
      expect(testHost.positionChanges[0].y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('requestAnimationFrame Throttling', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should throttle position updates using RAF', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Dispatch multiple mousemove events rapidly
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 140, clientY: 240 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));

      // Should not emit immediately due to RAF throttling
      expect(testHost.positionChanges).toHaveLength(0);

      // Wait for next animation frame
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should emit once with the latest position
      expect(testHost.positionChanges).toHaveLength(1);
      expect(testHost.positionChanges[0]).toEqual({ x: 150, y: 250 });
    }, 10000);

    it('should cancel pending RAF on new mousemove', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // First mousemove
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      // Immediately second mousemove (should cancel first RAF)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 220 }));

      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should only emit once with the latest position
      expect(testHost.positionChanges).toHaveLength(1);
      expect(testHost.positionChanges[0]).toEqual({ x: 120, y: 220 });
    }, 10000);

    it('should handle multiple RAF cycles correctly', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // First drag cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.positionChanges).toHaveLength(1);

      // Second drag cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 230 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.positionChanges).toHaveLength(2);

      // Third drag cycle
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(testHost.positionChanges).toHaveLength(3);
    }, 10000);

    it('should cancel RAF on ngOnDestroy', async () => {
      const startEvent = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
      dragElement.dispatchEvent(startEvent);

      // Trigger mousemove (schedules RAF)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 210 }));

      // Destroy before RAF completes
      directive.ngOnDestroy();

      // Wait longer than a frame
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not emit position change due to cleanup
      expect(testHost.positionChanges).toHaveLength(0);
    }, 10000);
  });
});
