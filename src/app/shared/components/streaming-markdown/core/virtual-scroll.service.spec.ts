import { TestBed } from '@angular/core/testing';
import { VirtualScrollService } from './virtual-scroll.service';
import { DEFAULT_VIRTUAL_SCROLL_CONFIG } from './models';

describe('VirtualScrollService', () => {
  let service: VirtualScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VirtualScrollService]
    });

    service = TestBed.inject(VirtualScrollService);
    service.setConfig(DEFAULT_VIRTUAL_SCROLL_CONFIG);
  });

  afterEach(() => {
    service.clearHeightCache();
    service.setScrollTop(0);
    service.setViewportHeight(0);
    service.setTotalBlocks(0);
  });

  it('should create service with default config', () => {
    expect(service).toBeTruthy();
    expect(service.getConfig()).toEqual(DEFAULT_VIRTUAL_SCROLL_CONFIG);
  });

  it('should compute window from scrollTop/viewportHeight/totalBlocks', () => {
    service.setViewportHeight(300);
    service.setTotalBlocks(200);
    service.setScrollTop(600);

    const window = service.window();

    expect(window.start).toBeGreaterThanOrEqual(0);
    expect(window.end).toBeGreaterThanOrEqual(window.start);
    expect(window.totalHeight).toBe(200 * 60);
    expect(window.offsetTop).toBeGreaterThanOrEqual(0);
  });

  it('should clamp scroll beyond total height to last range', () => {
    service.setViewportHeight(300);
    service.setTotalBlocks(10);
    service.setScrollTop(100000);

    const window = service.window();

    expect(window.end).toBe(9);
    expect(window.start).toBeLessThanOrEqual(9);
  });

  it('should handle empty block set gracefully', () => {
    service.setViewportHeight(400);
    service.setTotalBlocks(0);
    service.setScrollTop(100);

    const window = service.window();

    expect(window).toEqual({
      start: 0,
      end: 0,
      totalHeight: 0,
      offsetTop: 0
    });
  });

  it('should ignore negative block index height updates', () => {
    service.updateBlockHeight(-1, 120);
    expect(service.getBlockHeight(-1)).toBe(60);
  });

  it('should use cached heights in totalHeight/window', () => {
    service.setTotalBlocks(3);
    service.updateBlockHeight(0, 120);
    service.updateBlockHeight(1, 80);
    service.setViewportHeight(180);
    service.setScrollTop(0);

    expect(service.totalHeight()).toBe(260);

    const window = service.window();
    expect(window.totalHeight).toBe(260);
  });
});
