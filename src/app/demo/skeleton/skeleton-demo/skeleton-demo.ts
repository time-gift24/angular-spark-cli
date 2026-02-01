import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '@app/shared/ui/skeleton/skeleton';

@Component({
  selector: 'app-skeleton-demo',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './skeleton-demo.html',
  styleUrl: '../../shared/demo-page-styles.css',
})
export class SkeletonDemoComponent {}
