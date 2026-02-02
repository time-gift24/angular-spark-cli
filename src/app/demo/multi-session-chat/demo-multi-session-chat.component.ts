import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Demo navigation component for Multi-Session Chat page
 */
@Component({
  selector: 'app-demo-multi-session-chat',
  standalone: true,
  templateUrl: './demo-multi-session-chat.component.html',
  styleUrl: './demo-multi-session-chat.component.css'
})
export class DemoMultiSessionChatComponent {
  constructor(private router: Router) {}

  /**
   * Navigate to multi-session chat page
   */
  navigateToChat(): void {
    this.router.navigate(['/multi-session-chat']);
  }
}
