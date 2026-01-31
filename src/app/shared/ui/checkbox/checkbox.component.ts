import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const checkboxVariants = cva(
  // Base styles - ultra compact
  'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
);

export type CheckboxVariant = VariantProps<typeof checkboxVariants>;

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  template: `
    <input
      #input
      type="checkbox"
      [id]="id()"
      [checked]="checked()"
      [disabled]="disabled()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledby()"
      [attr.aria-describedby]="ariaDescribedby()"
      [attr.required]="required()"
      [attr.name]="name()"
      [attr.value]="value()"
      (change)="onChange($event)"
      (blur)="onTouched()"
      [class]="computedClass()"
    />
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        width: var(--checkbox-size);
        height: var(--checkbox-size);
        border-radius: var(--checkbox-border-radius);
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
      }

      input[type="checkbox"]:checked {
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        background-size: var(--checkbox-icon-size);
        background-position: center;
        background-repeat: no-repeat;
      }

      input[type="checkbox"]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  readonly input = viewChild.required('input', { read: ElementRef<HTMLInputElement> });

  // Inputs
  readonly id = input<string>();
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaInvalid = input<boolean | string>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledby = input<string>('');
  readonly ariaDescribedby = input<string>('');
  readonly required = input<boolean>(false);
  readonly name = input<string>('');
  readonly value = input<string>('on');
  readonly class = input<CheckboxVariant>('');

  // Outputs
  readonly checkedChange = output<boolean>();
  readonly change = output<Event>();

  // Computed classes
  protected computedClass = computed(() => {
    const baseClass = checkboxVariants();
    return cn(baseClass, this.class());
  });

  // Event handlers
  protected onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checkedChange.emit(input.checked);
    this.change.emit(event);
  }

  protected onTouched(): void {
    // Intentionally empty - for ControlValueAccessor implementation if needed
  }

  // Public methods
  focus(): void {
    this.input().nativeElement.focus();
  }

  blur(): void {
    this.input().nativeElement.blur();
  }
}
