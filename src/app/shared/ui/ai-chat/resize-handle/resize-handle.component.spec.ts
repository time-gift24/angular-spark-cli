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

  it('should clamp preview and commit within min/max bounds', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).createComponent(ResizeHandleComponent);

    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.minWidth = 300;
    component.maxWidth = 550;

    const getWidthSpy = spyOn(component as unknown as { getWidth: () => number }, 'getWidth');
    getWidthSpy.and.returnValue(500);

    const previewSpy = spyOn(component.resizePreview, 'emit');
    const commitSpy = spyOn(component.resizeCommit, 'emit');

    component.startDrag(new MouseEvent('mousedown', { clientX: 100 }));
    (component as unknown as { onMouseMove: (event: MouseEvent) => void }).onMouseMove(
      new MouseEvent('mousemove', { clientX: 0 }),
    );

    expect(component.previewWidth()).toBe(550);
    expect(previewSpy).toHaveBeenCalledWith(550);

    (component as unknown as { onMouseUp: (event: MouseEvent) => void }).onMouseUp(
      new MouseEvent('mouseup', { clientX: 0 }),
    );

    expect(component.previewWidth()).toBe(null);
    expect(commitSpy).toHaveBeenCalledWith(550);
  });
});
