import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DockedMessagesAreaComponent } from './docked-messages-area.component';

describe('DockedMessagesAreaComponent', () => {
  let component: DockedMessagesAreaComponent;
  let fixture: ComponentFixture<DockedMessagesAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DockedMessagesAreaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DockedMessagesAreaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept messages as input', () => {
    const messages = [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }
    ];

    component.messages = messages;
    fixture.detectChanges();

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].content).toBe('Hello');
  });
});
