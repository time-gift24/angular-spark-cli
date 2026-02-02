import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FloatingSessionRendererComponent } from './floating-session-renderer.component';
import { SessionData } from '@app/shared/models';

describe('FloatingSessionRendererComponent', () => {
  let component: FloatingSessionRendererComponent;
  let fixture: ComponentFixture<FloatingSessionRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingSessionRendererComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingSessionRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply session position to style', () => {
    const session: SessionData = {
      id: 'test-1',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 100, y: 200 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    expect(positionStyle['left']).toBe('100px');
    expect(positionStyle['top']).toBe('200px');
  });

  it('should apply session size to style', () => {
    const session: SessionData = {
      id: 'test-2',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 0, y: 0 },
      size: { width: 500, height: 600 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    expect(positionStyle['width']).toBe('500px');
    expect(positionStyle['height']).toBe('600px');
  });

  it('should use default position when session position is invalid', () => {
    const session: SessionData = {
      id: 'test-3',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: -100, y: -200 },  // Invalid position
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    // Should clamp to viewport bounds
    expect(parseInt(positionStyle['left'])).toBeGreaterThanOrEqual(0);
    expect(parseInt(positionStyle['top'])).toBeGreaterThanOrEqual(0);
  });
});
