import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ComboboxRootComponent,
  ComboboxInputComponent,
  ComboboxContentComponent,
  ComboboxListComponent,
  ComboboxItemComponent,
  ComboboxEmptyComponent,
  ComboboxGroupComponent,
  ComboboxLabelComponent,
  ComboboxSeparatorComponent,
} from '@app/shared/ui/combobox';

@Component({
  selector: 'app-combobox-demo',
  imports: [
    RouterLink,
    ComboboxRootComponent,
    ComboboxInputComponent,
    ComboboxContentComponent,
    ComboboxListComponent,
    ComboboxItemComponent,
    ComboboxEmptyComponent,
    ComboboxGroupComponent,
    ComboboxLabelComponent,
    ComboboxSeparatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './combobox-demo.component.html',
})
export class ComboboxDemoComponent {
  readonly selectedFruit = signal<string | null>(null);
  readonly selectedFramework = signal<string | null>('react');
  readonly selectedDisabled = signal<string | null>('apple');
  readonly fruits = [
    'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry',
    'Cherry', 'Coconut', 'Cranberry', 'Date', 'Dragonfruit', 'Fig',
    'Grape', 'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Mango',
    'Melon', 'Nectarine', 'Orange', 'Papaya', 'Peach', 'Pear', 'Plum',
    'Pineapple', 'Pomegranate', 'Raspberry', 'Strawberry', 'Watermelon'
  ];
  readonly frameworks = [
    { value: 'react', label: 'React', category: 'Frontend' },
    { value: 'vue', label: 'Vue.js', category: 'Frontend' },
    { value: 'angular', label: 'Angular', category: 'Frontend' },
    { value: 'svelte', label: 'Svelte', category: 'Frontend' },
    { value: 'nextjs', label: 'Next.js', category: 'Full Stack' },
    { value: 'nuxt', label: 'Nuxt', category: 'Full Stack' },
    { value: 'express', label: 'Express', category: 'Backend' },
    { value: 'nest', label: 'NestJS', category: 'Backend' },
  ];
  readonly categories = computed(() => {
    const cats = new Set(this.frameworks.map(f => f.category));
    return Array.from(cats);
  });
  readonly getFrameworksByCategory = (category: string) => {
    return this.frameworks.filter(f => f.category === category);
  };
}
