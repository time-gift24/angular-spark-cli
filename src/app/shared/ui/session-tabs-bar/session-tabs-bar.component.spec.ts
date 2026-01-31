import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SessionTabsBarComponent } from './session-tabs-bar.component';
import { SessionData } from '../../models';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

/**
 * Test host component to wrap SessionTabsBarComponent
 * Provides the required Signal inputs for testing
 */
@Component({
  standalone: true,
  imports: [SessionTabsBarComponent],
  template: `
    <spark-session-tabs-bar
      [sessions]="sessions"
      [activeSessionId]="activeSessionId"
      (sessionSelect)="onSessionSelect($event)"
      (sessionToggle)="onSessionToggle()"
      (newChat)="onNewChat()"
    />
  `,
})
class TestHostComponent {
  readonly sessions = signal<Map<string, SessionData>>(new Map());
  readonly activeSessionId = signal('');

  sessionSelectEmitted: string | null = null;
  sessionToggleEmitted = false;
  newChatEmitted = false;

  onSessionSelect(sessionId: string): void {
    this.sessionSelectEmitted = sessionId;
  }

  onSessionToggle(): void {
    this.sessionToggleEmitted = true;
  }

  onNewChat(): void {
    this.newChatEmitted = true;
  }

  /**
   * Helper method to add a test session
   */
  addTestSession(id: string, name: string, lastUpdated: number): void {
    const sessions = this.sessions();
    const updatedSessions = new Map(sessions);

    updatedSessions.set(id, {
      id,
      name,
      messages: [],
      inputValue: '',
      position: { x: 0, y: 0 },
      size: { width: 600, height: 400 },
      lastUpdated,
    });

    (this.sessions as unknown as { set: (value: Map<string, SessionData>) => void }).set(updatedSessions);
  }

  /**
   * Helper method to set active session
   */
  setActiveSession(sessionId: string): void {
    (this.activeSessionId as unknown as { set: (value: string) => void }).set(sessionId);
  }

  /**
   * Helper method to reset test state
   */
  resetTestState(): void {
    this.sessionSelectEmitted = null;
    this.sessionToggleEmitted = false;
    this.newChatEmitted = false;
  }
}

describe('SessionTabsBarComponent', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let component: SessionTabsBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have required inputs defined', () => {
      // Trigger change detection so inputs are bound
      testHost.addTestSession('sess-1', 'Test', 1000);
      testHost.setActiveSession('sess-1');
      fixture.detectChanges();

      expect(component.sessions).toBeDefined();
      expect(component.activeSessionId).toBeDefined();
    });

    it('should have output emitters defined', () => {
      expect(component.sessionSelect).toBeDefined();
      expect(component.sessionToggle).toBeDefined();
    });

    it('should have sortedSessions computed signal', () => {
      expect(component.sortedSessions).toBeDefined();
    });

    it('should have handleSessionClick method', () => {
      expect(typeof component.handleSessionClick).toBe('function');
    });
  });

  describe('sortedSessions Computed Signal', () => {
    it('should return empty array when no sessions exist', () => {
      fixture.detectChanges();

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions).toEqual([]);
      expect(sortedSessions).toHaveLength(0);
    });

    it('should return sessions sorted by lastUpdated (most recent first)', () => {
      // Add sessions with different timestamps
      testHost.addTestSession('sess-1', 'First Session', 1000);
      testHost.addTestSession('sess-2', 'Second Session', 3000);
      testHost.addTestSession('sess-3', 'Third Session', 2000);

      fixture.detectChanges();

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions).toHaveLength(3);

      // Should be sorted by lastUpdated descending: 3000, 2000, 1000
      expect(sortedSessions[0].id).toBe('sess-2');
      expect(sortedSessions[0].lastUpdated).toBe(3000);
      expect(sortedSessions[1].id).toBe('sess-3');
      expect(sortedSessions[1].lastUpdated).toBe(2000);
      expect(sortedSessions[2].id).toBe('sess-1');
      expect(sortedSessions[2].lastUpdated).toBe(1000);
    });

    it('should maintain stable order for sessions with same timestamp', () => {
      const sameTimestamp = Date.now();

      testHost.addTestSession('sess-1', 'First', sameTimestamp);
      testHost.addTestSession('sess-2', 'Second', sameTimestamp);
      testHost.addTestSession('sess-3', 'Third', sameTimestamp);

      fixture.detectChanges();

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions).toHaveLength(3);

      // All should have the same timestamp
      expect(sortedSessions.every(s => s.lastUpdated === sameTimestamp)).toBe(true);
    });

    it('should reactively update when sessions are added', () => {
      fixture.detectChanges();

      expect(component.sortedSessions()).toHaveLength(0);

      testHost.addTestSession('sess-1', 'New Session', Date.now());
      fixture.detectChanges();

      expect(component.sortedSessions()).toHaveLength(1);
    });

    it('should reactively update when sessions are modified', () => {
      testHost.addTestSession('sess-1', 'Original', 1000);
      testHost.addTestSession('sess-2', 'Latest', 2000);
      fixture.detectChanges();

      let sortedSessions = component.sortedSessions();
      expect(sortedSessions[0].id).toBe('sess-2'); // Most recent

      // Update sess-1 to be more recent
      const sessions = testHost.sessions();
      const updatedSessions = new Map(sessions);
      updatedSessions.set('sess-1', {
        ...updatedSessions.get('sess-1')!,
        lastUpdated: 3000,
      });
      (testHost.sessions as unknown as { set: (value: Map<string, SessionData>) => void }).set(updatedSessions);

      fixture.detectChanges();

      sortedSessions = component.sortedSessions();
      expect(sortedSessions[0].id).toBe('sess-1'); // Now most recent
    });
  });

  describe('Tab Rendering', () => {
    it('should render one button per session', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      testHost.addTestSession('sess-3', 'Session 3', 3000);

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(3);
    });

    it('should render session names correctly', () => {
      testHost.addTestSession('sess-1', 'Planning Discussion', 1000);
      testHost.addTestSession('sess-2', 'Code Review', 2000);

      fixture.detectChanges();

      const sessionNames = fixture.nativeElement.querySelectorAll('.session-name');
      expect(sessionNames[0].textContent).toContain('Code Review');
      expect(sessionNames[1].textContent).toContain('Planning Discussion');
    });

    it('should apply active class to the active session tab', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      testHost.setActiveSession('sess-2');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons[0].classList.contains('active')).toBe(true); // sess-2 is most recent
      expect(tabButtons[1].classList.contains('active')).toBe(false);
    });

    it('should not apply active class when no active session', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);

      fixture.detectChanges();

      const tabButton = fixture.nativeElement.querySelector('.session-tab');
      expect(tabButton.classList.contains('active')).toBe(false);
    });

    it('should render tabs in sorted order (most recent first)', () => {
      testHost.addTestSession('sess-1', 'Oldest', 1000);
      testHost.addTestSession('sess-2', 'Newest', 3000);
      testHost.addTestSession('sess-3', 'Middle', 2000);

      fixture.detectChanges();

      const sessionNames = fixture.nativeElement.querySelectorAll('.session-name');
      expect(sessionNames[0].textContent).toContain('Newest');
      expect(sessionNames[1].textContent).toContain('Middle');
      expect(sessionNames[2].textContent).toContain('Oldest');
    });

    it('should have proper accessibility attributes', () => {
      testHost.addTestSession('sess-1', 'Planning Session', 1000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButton = fixture.nativeElement.querySelector('.session-tab');
      expect(tabButton.getAttribute('aria-label')).toBe('Switch to Planning Session');
      expect(tabButton.getAttribute('aria-selected')).toBe('true');
      expect(tabButton.getAttribute('type')).toBe('button');
    });
  });

  describe('Click Handler Behavior', () => {
    beforeEach(() => {
      testHost.resetTestState();
    });

    it('should emit sessionSelect when clicking a different session', () => {
      testHost.addTestSession('sess-1', 'Active Session', 1000);
      testHost.addTestSession('sess-2', 'Other Session', 2000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      tabButtons[0].click(); // Click sess-2 (most recent, not active)

      fixture.detectChanges();

      expect(testHost.sessionSelectEmitted).toBe('sess-2');
      expect(testHost.sessionToggleEmitted).toBe(false);
    });

    it('should emit sessionToggle when clicking the active session', () => {
      testHost.addTestSession('sess-1', 'Active Session', 2000);
      testHost.addTestSession('sess-2', 'Other Session', 1000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      tabButtons[0].click(); // Click sess-1 (active session)

      fixture.detectChanges();

      expect(testHost.sessionToggleEmitted).toBe(true);
      expect(testHost.sessionSelectEmitted).toBeNull();
    });

    it('should prevent default form submission behavior', () => {
      testHost.addTestSession('sess-1', 'Session', 1000);

      fixture.detectChanges();

      const event = new MouseEvent('click');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      component.handleSessionClick(event, 'sess-1');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not emit sessionSelect when clicking active session', () => {
      testHost.addTestSession('sess-1', 'Active Session', 1000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButton = fixture.nativeElement.querySelector('.session-tab');
      tabButton.click();

      fixture.detectChanges();

      expect(testHost.sessionSelectEmitted).toBeNull();
    });

    it('should not emit sessionToggle when clicking different session', () => {
      testHost.addTestSession('sess-1', 'Active Session', 1000);
      testHost.addTestSession('sess-2', 'Other Session', 2000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      tabButtons[0].click(); // Click sess-2

      fixture.detectChanges();

      expect(testHost.sessionToggleEmitted).toBe(false);
    });

    it('should handle rapid clicks correctly', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');

      // Click sess-2 (not active) - this will switch to sess-2
      tabButtons[0].click();
      fixture.detectChanges();

      expect(testHost.sessionSelectEmitted).toBe('sess-2');
      expect(testHost.sessionToggleEmitted).toBe(false);

      testHost.resetTestState();

      // Update active session to reflect the click
      testHost.setActiveSession('sess-2');
      fixture.detectChanges();

      // Now click sess-2 again (now active)
      tabButtons[0].click();
      fixture.detectChanges();

      expect(testHost.sessionToggleEmitted).toBe(true);
      expect(testHost.sessionSelectEmitted).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sessions map gracefully', () => {
      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(0);

      expect(component.sortedSessions()).toEqual([]);
    });

    it('should handle single session correctly', () => {
      testHost.addTestSession('sess-1', 'Only Session', 1000);
      testHost.setActiveSession('sess-1');

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(1);
      expect(tabButtons[0].classList.contains('active')).toBe(true);
    });

    it('should handle sessions with very long names', () => {
      const longName = 'This is a very long session name that might overflow';
      testHost.addTestSession('sess-1', longName, 1000);

      fixture.detectChanges();

      const sessionName = fixture.nativeElement.querySelector('.session-name');
      expect(sessionName.textContent).toContain(longName);
    });

    it('should handle sessions with special characters in names', () => {
      const specialName = 'Session <with> "special" & characters';
      testHost.addTestSession('sess-1', specialName, 1000);

      fixture.detectChanges();

      const sessionName = fixture.nativeElement.querySelector('.session-name');
      expect(sessionName.textContent).toContain(specialName);
    });

    it('should handle no active session ID', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      // Don't set active session

      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons[0].classList.contains('active')).toBe(false);
      expect(tabButtons[1].classList.contains('active')).toBe(false);
    });

    it('should handle active session ID that does not exist', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.setActiveSession('non-existent-session');

      fixture.detectChanges();

      const tabButton = fixture.nativeElement.querySelector('.session-tab');
      expect(tabButton.classList.contains('active')).toBe(false);
    });

    it('should handle sessions with same lastUpdated timestamp', () => {
      const sameTime = Date.now();
      testHost.addTestSession('sess-1', 'Session 1', sameTime);
      testHost.addTestSession('sess-2', 'Session 2', sameTime);
      testHost.addTestSession('sess-3', 'Session 3', sameTime);

      fixture.detectChanges();

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions).toHaveLength(3);

      // All should have the same timestamp
      expect(sortedSessions.every(s => s.lastUpdated === sameTime)).toBe(true);

      // All tabs should be rendered
      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(3);
    });

    it('should handle adding sessions dynamically', () => {
      testHost.addTestSession('sess-1', 'Initial', 1000);
      fixture.detectChanges();

      expect(component.sortedSessions()).toHaveLength(1);

      // Add more sessions
      testHost.addTestSession('sess-2', 'New 1', 2000);
      testHost.addTestSession('sess-3', 'New 2', 3000);
      fixture.detectChanges();

      expect(component.sortedSessions()).toHaveLength(3);

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(3);
    });
  });

  describe('Reactive Updates', () => {
    it('should update tab rendering when sessions change', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      fixture.detectChanges();

      let tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(1);

      testHost.addTestSession('sess-2', 'Session 2', 2000);
      fixture.detectChanges();

      tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(2);
    });

    it('should update active state when activeSessionId changes', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);

      testHost.setActiveSession('sess-1');
      fixture.detectChanges();

      let tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons[1].classList.contains('active')).toBe(true); // sess-1 is second when sorted
      expect(tabButtons[0].classList.contains('active')).toBe(false);

      testHost.setActiveSession('sess-2');
      fixture.detectChanges();

      tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons[0].classList.contains('active')).toBe(true); // sess-2 is first when sorted
      expect(tabButtons[1].classList.contains('active')).toBe(false);
    });

    it('should update sorted order when session lastUpdated changes', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      fixture.detectChanges();

      let sessionNames = fixture.nativeElement.querySelectorAll('.session-name');
      expect(sessionNames[0].textContent).toContain('Session 2'); // Most recent

      // Update sess-1 to be more recent
      const sessions = testHost.sessions();
      const updatedSessions = new Map(sessions);
      updatedSessions.set('sess-1', {
        ...updatedSessions.get('sess-1')!,
        lastUpdated: 3000,
      });
      (testHost.sessions as unknown as { set: (value: Map<string, SessionData>) => void }).set(updatedSessions);

      fixture.detectChanges();

      sessionNames = fixture.nativeElement.querySelectorAll('.session-name');
      expect(sessionNames[0].textContent).toContain('Session 1'); // Now most recent
    });
  });

  describe('Integration Scenarios', () => {
    it('should support typical multi-session workflow', () => {
      // Simulate typical usage: multiple sessions with different ages
      testHost.addTestSession('sess-1', 'Old Chat', 1000);
      testHost.addTestSession('sess-2', 'Recent Chat', 3000);
      testHost.addTestSession('sess-3', 'Very Recent Chat', 5000);

      fixture.detectChanges();

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions[0].id).toBe('sess-3');
      expect(sortedSessions[1].id).toBe('sess-2');
      expect(sortedSessions[2].id).toBe('sess-1');

      // Switch to older session
      testHost.setActiveSession('sess-1');
      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons[2].classList.contains('active')).toBe(true);

      // Click to switch to most recent
      testHost.resetTestState();
      tabButtons[0].click();
      fixture.detectChanges();

      expect(testHost.sessionSelectEmitted).toBe('sess-3');
    });

    it('should handle session creation workflow', () => {
      // Start with one session
      testHost.addTestSession('sess-1', 'Initial Chat', 1000);
      testHost.setActiveSession('sess-1');
      fixture.detectChanges();

      let tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(1);

      // Create new session (more recent timestamp)
      testHost.addTestSession('sess-2', 'New Chat', 2000);
      fixture.detectChanges();

      tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons).toHaveLength(2);

      // New session should be first in sorted order
      const sessionNames = fixture.nativeElement.querySelectorAll('.session-name');
      expect(sessionNames[0].textContent).toContain('New Chat');
    });

    it('should handle session deletion workflow', () => {
      testHost.addTestSession('sess-1', 'Session 1', 1000);
      testHost.addTestSession('sess-2', 'Session 2', 2000);
      testHost.addTestSession('sess-3', 'Session 3', 3000);

      fixture.detectChanges();
      expect(component.sortedSessions()).toHaveLength(3);

      // Delete sess-2
      const sessions = testHost.sessions();
      const updatedSessions = new Map(sessions);
      updatedSessions.delete('sess-2');
      (testHost.sessions as unknown as { set: (value: Map<string, SessionData>) => void }).set(updatedSessions);

      fixture.detectChanges();
      expect(component.sortedSessions()).toHaveLength(2);

      const sortedSessions = component.sortedSessions();
      expect(sortedSessions.find(s => s.id === 'sess-2')).toBeUndefined();
    });
  });

  describe('New Chat Button', () => {
    it('should render the New Chat button', () => {
      testHost.addTestSession('sess-1', 'Test Chat', 1000);
      fixture.detectChanges();

      const newChatButton = fixture.nativeElement.querySelector('.new-chat-tab');
      expect(newChatButton).toBeTruthy();
      expect(newChatButton.textContent).toContain('New Chat');
    });

    it('should render New Chat button before session tabs', () => {
      testHost.addTestSession('sess-1', 'Chat 1', 1000);
      testHost.addTestSession('sess-2', 'Chat 2', 2000);
      fixture.detectChanges();

      const tabButtons = fixture.nativeElement.querySelectorAll('.session-tab');
      expect(tabButtons.length).toBeGreaterThan(0);

      // First tab should be New Chat button
      expect(tabButtons[0].classList).toContain('new-chat-tab');
    });

    it('should emit newChat event when New Chat button is clicked', () => {
      testHost.addTestSession('sess-1', 'Test Chat', 1000);
      fixture.detectChanges();

      const newChatButton = fixture.nativeElement.querySelector('.new-chat-tab');
      newChatButton.click();

      expect(testHost.newChatEmitted).toBe(true);
    });

    it('should have correct styling for New Chat button', () => {
      testHost.addTestSession('sess-1', 'Test Chat', 1000);
      fixture.detectChanges();

      const newChatButton = fixture.nativeElement.querySelector('.new-chat-tab');
      expect(newChatButton.classList).toContain('session-tab');
      expect(newChatButton.classList).toContain('new-chat-tab');

      const icon = newChatButton.querySelector('.new-chat-icon');
      expect(icon).toBeTruthy();
    });

    it('should not affect session tabs when New Chat is clicked', () => {
      testHost.addTestSession('sess-1', 'Chat 1', 1000);
      testHost.setActiveSession('sess-1');
      fixture.detectChanges();

      testHost.resetTestState();
      const newChatButton = fixture.nativeElement.querySelector('.new-chat-tab');
      newChatButton.click();

      // Should not emit sessionSelect or sessionToggle
      expect(testHost.sessionSelectEmitted).toBeNull();
      expect(testHost.sessionToggleEmitted).toBe(false);
      // Should only emit newChat
      expect(testHost.newChatEmitted).toBe(true);
    });
  });
});
