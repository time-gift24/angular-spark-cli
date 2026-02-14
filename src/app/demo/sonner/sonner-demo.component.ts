import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SonnerService, type SonnerPosition, SonnerComponent } from '@app/shared/ui/sonner';

@Component({
  selector: 'app-sonner-demo',
  imports: [SonnerComponent],
  templateUrl: './sonner-demo.component.html',
  styleUrls: ['./sonner-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class SonnerDemoComponent {
  private readonly sonnerService = inject(SonnerService);

  readonly selectedPosition = signal<SonnerPosition>('bottom-right');
  readonly selectedDuration = signal<number>(4000);

  // Basic scenarios
  showDefault(): void {
    this.sonnerService.open({
      title: 'Default notification',
      description: 'This is a default toast notification',
      position: this.selectedPosition(),
      duration: this.selectedDuration(),
    });
  }

  showSuccess(): void {
    this.sonnerService.success(
      'Success!',
      'Your changes have been saved successfully.',
      { position: this.selectedPosition(), duration: this.selectedDuration() }
    );
  }

  showError(): void {
    this.sonnerService.error(
      'Error occurred',
      'Failed to save your changes. Please try again.',
      { position: this.selectedPosition(), duration: this.selectedDuration() }
    );
  }

  showWarning(): void {
    this.sonnerService.warning(
      'Warning',
      'Your session will expire in 5 minutes.',
      { position: this.selectedPosition(), duration: this.selectedDuration() }
    );
  }

  showInfo(): void {
    this.sonnerService.info(
      'New message',
      'You have received a new message from your team.',
      { position: this.selectedPosition(), duration: this.selectedDuration() }
    );
  }

  // With action
  showWithAction(): void {
    this.sonnerService.open({
      title: 'Undo changes?',
      description: 'Your changes have been discarded.',
      variant: 'default',
      position: this.selectedPosition(),
      duration: this.selectedDuration(),
      action: {
        label: 'Undo',
        onClick: () => {
          console.log('Undo action clicked');
        },
      },
    });
  }

  // Destructive with action
  showDestructiveWithAction(): void {
    this.sonnerService.open({
      title: 'Delete item?',
      description: 'This action cannot be undone.',
      variant: 'destructive',
      position: this.selectedPosition(),
      duration: this.selectedDuration(),
      action: {
        label: 'Delete',
        onClick: () => {
          console.log('Delete action clicked');
        },
      },
    });
  }

  // With promise
  showWithPromise(): void {
    this.sonnerService.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve('Data loaded successfully'), 2000);
      }),
      {
        loading: 'Loading data...',
        success: (data) => `${data}`,
        error: 'Failed to load data',
      }
    );
  }

  // Position examples
  showAtTopLeft(): void {
    this.sonnerService.open({
      title: 'Top Left',
      description: 'Notification at top left corner',
      position: 'top-left',
    });
  }

  showAtTopRight(): void {
    this.sonnerService.open({
      title: 'Top Right',
      description: 'Notification at top right corner',
      position: 'top-right',
    });
  }

  showAtBottomLeft(): void {
    this.sonnerService.open({
      title: 'Bottom Left',
      description: 'Notification at bottom left corner',
      position: 'bottom-left',
    });
  }

  showAtBottomCenter(): void {
    this.sonnerService.open({
      title: 'Bottom Center',
      description: 'Notification at bottom center',
      position: 'bottom-center',
    });
  }

  dismissAll(): void {
    this.sonnerService.dismissAll();
  }

  onPositionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPosition.set(target.value as SonnerPosition);
  }

  onDurationChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedDuration.set(Number.parseInt(target.value, 10));
  }
}
