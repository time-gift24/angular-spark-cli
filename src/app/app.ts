import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ButtonComponent } from '@app/shared/ui/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-spark-cli');
}
