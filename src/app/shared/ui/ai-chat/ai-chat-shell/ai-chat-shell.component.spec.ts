import 'zone.js';
import 'zone.js/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AiChatShellComponent } from './ai-chat-shell.component';

@Component({
  standalone: true,
  template: '<div>Dummy Route</div>',
})
class DummyRouteComponent {}

describe('AiChatShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyRouteComponent },
          { path: 'demo/ai-chat-panel', component: DummyRouteComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('renders with dock pinned by default', () => {
    const fixture = TestBed.createComponent(AiChatShellComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const toggleButton = host.querySelector('header button');
    expect(toggleButton?.textContent).toContain('收起 LLM');

    const dockTabs = host.querySelector('spark-session-tabs-bar');
    expect(dockTabs).toBeTruthy();
  });

  it('collapses and reopens dock through controls', () => {
    const fixture = TestBed.createComponent(AiChatShellComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const toggleButton = host.querySelector('header button') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    const openButton = Array.from(host.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('LLM'),
    ) as HTMLButtonElement | undefined;
    expect(openButton).toBeTruthy();
    expect(toggleButton.textContent).toContain('展开 LLM');

    openButton?.click();
    fixture.detectChanges();
    expect(toggleButton.textContent).toContain('收起 LLM');
  });
});
