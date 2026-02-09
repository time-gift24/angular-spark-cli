import { TestBed } from '@angular/core/testing';
import { ResizeHandleComponent } from './resize-handle.component';

describe('ResizeHandleComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).createComponent(ResizeHandleComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start dragging on mousedown', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).createComponent(ResizeHandleComponent);

    expect(fixture.componentInstance.isDragging).toBe(false);

    const event = new MouseEvent('mousedown', { clientX: 1000 });
    fixture.componentInstance.onMousedown(event);

    expect(fixture.componentInstance.isDragging).toBe(true);
  });
});
