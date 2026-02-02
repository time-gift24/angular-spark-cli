import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownListComponent } from './list.component';
import { MarkdownBlock, BlockType } from '../../core/models';

// Vitest imports
import { beforeEach, describe, it, expect } from 'vitest';

/**
 * Unit Tests for MarkdownListComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Ordered list rendering
 * - Unordered list rendering
 * - Nested list support
 * - Depth tracking
 * - CSS class application
 * - Edge cases (empty lists, invalid data)
 */
describe('MarkdownListComponent', () => {
  let component: MarkdownListComponent;
  let fixture: ComponentFixture<MarkdownListComponent>;

  const createMockBlock = (content: string, items?: MarkdownBlock[]): MarkdownBlock => ({
    id: `block-${Math.random()}`,
    type: BlockType.LIST,
    content,
    isComplete: true,
    position: 0,
    items
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownListComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default ordered state as false', () => {
      expect(component.ordered).toBe(false);
    });

    it('should have default depth as 0', () => {
      expect(component.depth).toBe(0);
    });

    it('should initialize with base list classes', () => {
      expect(component.listClasses()).toBe('markdown-list block-list');
    });

    it('should have default item class', () => {
      expect(component.itemClass).toBe('list-item');
    });
  });

  describe('Unordered List Rendering', () => {
    it('should render ul element when ordered is false', () => {
      component.items = [
        createMockBlock('Item 1'),
        createMockBlock('Item 2'),
        createMockBlock('Item 3')
      ];
      component.ordered = false;
      fixture.detectChanges();

      const ul = fixture.nativeElement.querySelector('ul');
      expect(ul).toBeTruthy();
      expect(ul.classList.contains('markdown-list')).toBe(true);
    });

    it('should not render ol when ordered is false', () => {
      component.items = [createMockBlock('Item')];
      component.ordered = false;
      fixture.detectChanges();

      const ol = fixture.nativeElement.querySelector('ol');
      expect(ol).toBeFalsy();
    });

    it('should render all list items', () => {
      component.items = [
        createMockBlock('First'),
        createMockBlock('Second'),
        createMockBlock('Third')
      ];
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('li');
      expect(lis.length).toBe(3);
      expect(lis[0].textContent).toBe('First');
      expect(lis[1].textContent).toBe('Second');
      expect(lis[2].textContent).toBe('Third');
    });

    it('should apply correct CSS classes to list items', () => {
      component.items = [createMockBlock('Test')];
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li.classList.contains('list-item')).toBe(true);
      expect(li.classList.contains('depth-0')).toBe(true);
    });
  });

  describe('Ordered List Rendering', () => {
    it('should render ol element when ordered is true', () => {
      component.items = [
        createMockBlock('Item 1'),
        createMockBlock('Item 2')
      ];
      component.ordered = true;
      fixture.detectChanges();

      const ol = fixture.nativeElement.querySelector('ol');
      expect(ol).toBeTruthy();
      expect(ol.classList.contains('markdown-list')).toBe(true);
    });

    it('should not render ul when ordered is true', () => {
      component.items = [createMockBlock('Item')];
      component.ordered = true;
      fixture.detectChanges();

      const ul = fixture.nativeElement.querySelector('ul');
      expect(ul).toBeFalsy();
    });

    it('should render list items in ol', () => {
      component.items = [
        createMockBlock('First'),
        createMockBlock('Second')
      ];
      component.ordered = true;
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('ol li');
      expect(lis.length).toBe(2);
    });
  });

  describe('Nested List Support', () => {
    it('should render nested lists', () => {
      component.items = [
        createMockBlock('Parent 1', [
          createMockBlock('Child 1.1'),
          createMockBlock('Child 1.2')
        ])
      ];
      component.ordered = false;
      fixture.detectChanges();

      const nestedList = fixture.nativeElement.querySelector('app-markdown-list');
      expect(nestedList).toBeTruthy();
    });

    it('should pass depth to nested lists', () => {
      component.items = [
        createMockBlock('Parent', [
          createMockBlock('Child')
        ])
      ];
      component.depth = 0;
      fixture.detectChanges();

      const nestedList = fixture.nativeElement.querySelector('app-markdown-list');
      expect(nestedList.getAttribute('ng-reflect-depth')).toBe('1');
    });

    it('should maintain ordered type in nested lists', () => {
      component.items = [
        createMockBlock('Parent', [
          createMockBlock('Child')
        ])
      ];
      component.ordered = true;
      fixture.detectChanges();

      const nestedList = fixture.nativeElement.querySelector('app-markdown-list');
      expect(nestedList.getAttribute('ng-reflect-ordered')).toBe('true');
    });

    it('should handle multiple levels of nesting', () => {
      component.items = [
        createMockBlock('Level 1', [
          createMockBlock('Level 2', [
            createMockBlock('Level 3')
          ])
        ])
      ];
      component.depth = 0;
      fixture.detectChanges();

      const nestedLists = fixture.nativeElement.querySelectorAll('app-markdown-list');
      expect(nestedLists.length).toBe(2); // One at level 1, one at level 2
    });

    it('should apply depth-specific classes to nested items', () => {
      component.items = [
        createMockBlock('Parent', [
          createMockBlock('Child')
        ])
      ];
      component.depth = 1;
      fixture.detectChanges();

      const parentLi = fixture.nativeElement.querySelector('ul > li');
      expect(parentLi.classList.contains('depth-1')).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should apply markdown-list class to list element', () => {
      component.items = [createMockBlock('Test')];
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('ul');
      expect(list.classList.contains('markdown-list')).toBe(true);
    });

    it('should apply block-list class to list element', () => {
      component.items = [createMockBlock('Test')];
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('ul');
      expect(list.classList.contains('block-list')).toBe(true);
    });

    it('should include depth in item class', () => {
      component.items = [createMockBlock('Test')];
      component.depth = 2;
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li.classList.contains('depth-2')).toBe(true);
    });

    it('should apply list-item class to all items', () => {
      component.items = [
        createMockBlock('Item 1'),
        createMockBlock('Item 2')
      ];
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('li');
      expect(lis[0].classList.contains('list-item')).toBe(true);
      expect(lis[1].classList.contains('list-item')).toBe(true);
    });
  });

  describe('getItemClass Method', () => {
    it('should return correct class for depth 0', () => {
      component.depth = 0;
      // Access through test since getItemClass is protected
      const itemClass = (component as any).getItemClass();
      expect(itemClass).toBe('list-item depth-0');
    });

    it('should return correct class for depth 1', () => {
      component.depth = 1;
      const itemClass = (component as any).getItemClass();
      expect(itemClass).toBe('list-item depth-1');
    });

    it('should return correct class for depth 5', () => {
      component.depth = 5;
      const itemClass = (component as any).getItemClass();
      expect(itemClass).toBe('list-item depth-5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      component.items = [];
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('li');
      expect(lis.length).toBe(0);
    });

    it('should handle single item', () => {
      component.items = [createMockBlock('Only item')];
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('li');
      expect(lis.length).toBe(1);
    });

    it('should handle item with empty content', () => {
      component.items = [createMockBlock('')];
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li.textContent).toBe('');
    });

    it('should handle item with special characters', () => {
      component.items = [createMockBlock('Item with <special> & "characters"')];
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li.textContent).toBe('Item with <special> & "characters"');
    });

    it('should handle item with very long content', () => {
      const longContent = 'A'.repeat(500);
      component.items = [createMockBlock(longContent)];
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li.textContent).toBe(longContent);
    });

    it('should handle item with empty nested items array', () => {
      component.items = [
        createMockBlock('Parent', [])
      ];
      fixture.detectChanges();

      const nestedList = fixture.nativeElement.querySelector('app-markdown-list');
      expect(nestedList).toBeFalsy();
    });

    it('should handle null nested items', () => {
      component.items = [
        createMockBlock('Parent', null as unknown as MarkdownBlock[])
      ];
      fixture.detectChanges();

      const li = fixture.nativeElement.querySelector('li');
      expect(li).toBeTruthy();
    });
  });

  describe('Large Lists', () => {
    it('should handle large number of items', () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        createMockBlock(`Item ${i}`)
      );
      component.items = items;
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('li');
      expect(lis.length).toBe(100);
    });
  });

  describe('Mixed Content', () => {
    it('should handle items with and without nested lists', () => {
      component.items = [
        createMockBlock('Item 1'),
        createMockBlock('Item 2', [createMockBlock('Nested')]),
        createMockBlock('Item 3')
      ];
      fixture.detectChanges();

      const lis = fixture.nativeElement.querySelectorAll('ul > li');
      expect(lis.length).toBe(3);

      const nestedLists = fixture.nativeElement.querySelectorAll('app-markdown-list');
      expect(nestedLists.length).toBe(1);
    });
  });
});
