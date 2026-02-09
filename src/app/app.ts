import { Component } from '@angular/core';
import { AiChatShellComponent } from './shared/ui/ai-chat';

@Component({
  selector: 'app-root',
  imports: [AiChatShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
