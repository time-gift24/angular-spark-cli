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
});
