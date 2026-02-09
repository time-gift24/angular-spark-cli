import { TestBed } from '@angular/core/testing';
import { AiChatShellComponent } from './ai-chat-shell.component';
import { AiChatStateService } from '../services';
import { provideRouter } from '@angular/router';

describe('AiChatShellComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [AiChatStateService, provideRouter([])],
    }).createComponent(AiChatShellComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should center session container relative to main content bounds', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [AiChatStateService, provideRouter([])],
    }).createComponent(AiChatShellComponent);

    fixture.detectChanges();

    const component = fixture.componentInstance;
    const mainEl = fixture.nativeElement.querySelector('main') as HTMLElement;

    spyOn(mainEl, 'getBoundingClientRect').and.returnValue({
      left: 120,
      width: 800,
      top: 0,
      right: 920,
      bottom: 0,
      height: 600,
      x: 120,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    (component as unknown as { updateMainBounds: () => void }).updateMainBounds();

    expect(component.sessionContainerLeftPx()).toBe(520);
    expect(component.sessionContainerWidthPx()).toBe(320);
  });

  it('should clamp preview width and commit to min/max', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [AiChatStateService, provideRouter([])],
    }).createComponent(AiChatShellComponent);

    fixture.detectChanges();

    const component = fixture.componentInstance;
    const chatState = TestBed.inject(AiChatStateService);

    component.onResizePreview(1000);
    expect(component.panelPreviewWidth()).toBe(800);
    expect(component.effectivePanelWidth()).toBe(800);

    component.onResizePreview(200);
    expect(component.panelPreviewWidth()).toBe(300);
    expect(component.effectivePanelWidth()).toBe(300);

    component.onResizeCommit(1000);
    expect(component.panelPreviewWidth()).toBe(null);
    expect(chatState.panelWidth()).toBe(800);
  });
});
