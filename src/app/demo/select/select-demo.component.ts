import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SelectRootComponent,
  SelectTriggerComponent,
  SelectContentComponent,
  SelectItemComponent,
} from '@app/shared/ui/select';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-demo',
  imports: [
    SelectRootComponent,
    SelectTriggerComponent,
    SelectContentComponent,
    SelectItemComponent,
  ],
  templateUrl: './select-demo.component.html',
  styleUrl: './select-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class SelectDemoComponent {
  readonly fruits: SelectOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape' },
    { value: 'watermelon', label: 'Watermelon' },
  ];

  readonly cities: SelectOption[] = [
    { value: 'beijing', label: 'Beijing' },
    { value: 'shanghai', label: 'Shanghai' },
    { value: 'guangzhou', label: 'Guangzhou' },
    { value: 'shenzhen', label: 'Shenzhen' },
    { value: 'hangzhou', label: 'Hangzhou' },
  ];

  readonly users: SelectOption[] = [
    { value: 'alice', label: 'Alice', disabled: true },
    { value: 'bob', label: 'Bob' },
    { value: 'charlie', label: 'Charlie' },
    { value: 'diana', label: 'Diana' },
  ];

  readonly priorities: SelectOption[] = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
  ];

  readonly selectedFruit = signal('');
  readonly selectedCity = signal('');
  readonly selectedUser = signal('');
  readonly selectedPriority = signal('');

  onFruitChange(val: string): void {
    console.log('Selected fruit:', val);
  }

  getSelectedLabel(opts: SelectOption[], val: string): string {
    if (!val) return 'Not selected';
    return opts.find((opt) => opt.value === val)?.label || 'Unknown';
  }

  resetSelections(): void {
    this.selectedFruit.set('');
    this.selectedCity.set('');
    this.selectedUser.set('');
    this.selectedPriority.set('');
  }

  submitForm(): void {
    console.log({
      fruit: this.selectedFruit(),
      city: this.selectedCity(),
      user: this.selectedUser(),
      priority: this.selectedPriority(),
    });
    alert('Form data submitted to console');
  }
}
