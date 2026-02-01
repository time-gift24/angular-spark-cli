import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AvatarComponent,
  AvatarImageComponent,
  AvatarFallbackComponent,
  type AvatarSize,
} from '../../../shared/ui/avatar';

export interface AvatarExample {
  src: string;
  alt: string;
  fallback: string;
  size?: AvatarSize;
  rounded?: boolean;
}

const examples: AvatarExample[] = [
  {
    src: 'https://github.com/shadcn.png',
    alt: '@shadcn',
    fallback: 'CN',
    size: 'md',
  },
  {
    src: 'https://github.com/evilrabbit.png',
    alt: '@evilrabbit',
    fallback: 'ER',
    size: 'md',
  },
];

@Component({
  selector: 'app-avatar-demo',
  standalone: true,
  imports: [CommonModule, AvatarComponent, AvatarImageComponent, AvatarFallbackComponent],
  templateUrl: './avatar-demo.html',
  styleUrl: '../../shared/demo-page-styles.css',
})
export class AvatarDemoComponent {
  readonly examples = examples;
  readonly currentExample = signal<AvatarExample>(this.examples[0]);
}
