import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualScrollViewportComponent } from './virtual-scroll-viewport.component';
import { DEFAULT_VIRTUAL_SCROLL_CONFIG, VirtualWindow } from '../core/models';

describe('VirtualScrollViewportComponent', () => {
  let fixture: ComponentFixture<VirtualScrollViewportComponent>;
  let component: VirtualScrollViewportComponent;

  const wait = (ms = 20): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualScrollViewportComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VirtualScrollViewportComponent);
    component = fixture.componentInstance;

    component.blocks = [];
    component.config = DEFAULT_VIRTUAL_SCROLL_CONFIG;
    component.window = {
      start: 0,
      end: 9,
      totalHeight: 3000,
      offsetTop: 0
    };

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit scroll metrics after user scroll', async () => {
    const scrollSpy = jasmine.createSpy('scrollSpy');
    component.scroll.subscribe(scrollSpy);

    const viewport = component.getViewportElement()!;
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 3000 });

    viewport.scrollTop = 240;
    viewport.dispatchEvent(new Event('scroll'));

    await wait();

    expect(component.scrollTop()).toBe(240);
    expect(component.viewportHeight()).toBe(300);
    expect(scrollSpy).toHaveBeenCalled();
    expect(scrollSpy.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({
        scrollTop: 240,
        clientHeight: 300,
        scrollHeight: 3000
      })
    );
  });

  it('should emit visibleRangeChange with latest window', async () => {
    const rangeSpy = jasmine.createSpy('rangeSpy');
    component.visibleRangeChange.subscribe(rangeSpy);

    const nextWindow: VirtualWindow = {
      start: 10,
      end: 25,
      totalHeight: 3000,
      offsetTop: 600
    };

    component.window = nextWindow;
    fixture.detectChanges();

    const viewport = component.getViewportElement()!;
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 3000 });

    viewport.scrollTop = 700;
    viewport.dispatchEvent(new Event('scroll'));

    await wait();

    expect(rangeSpy).toHaveBeenCalledWith(nextWindow);
  });

  it('should update scroll metrics when calling scrollToBottom', async () => {
    const viewport = component.getViewportElement()!;
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 3000 });

    component.scrollToBottom();
    await wait();

    expect(component.scrollTop()).toBeGreaterThan(0);
  });
});
