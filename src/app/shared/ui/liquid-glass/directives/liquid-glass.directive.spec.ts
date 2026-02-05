import { Component, ViewChild, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LiquidGlassDirective } from './liquid-glass.directive';

// Test component to host the directive
@Component({
  template: `<div liquidGlass [lgTheme]="'mineral-dark'" class="p-4">Test Content</div>`,
  standalone: true,
  imports: [LiquidGlassDirective],
})
class TestHostComponent {
  @ViewChild(LiquidGlassDirective, { static: true })
  directive!: LiquidGlassDirective;
}

describe('LiquidGlassDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: LiquidGlassDirective;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    directive = fixture.componentInstance.directive;
    element = fixture.nativeElement.querySelector('[liquidGlass]');
  });

  it('should create directive', () => {
    expect(directive).toBeTruthy();
  });

  it('should initialize with isHovered = false', () => {
    expect(directive['isHovered']).toBe(false);
  });

  it('should initialize with isFocused = false', () => {
    expect(directive['isFocused']).toBe(false);
  });

  describe('isActivated', () => {
    it('should return false when neither hovered nor focused', () => {
      directive['isHovered'] = false;
      directive['isFocused'] = false;
      expect(directive['isActivated']()).toBe(false);
    });

    it('should return true when hovered but not focused', () => {
      directive['isHovered'] = true;
      directive['isFocused'] = false;
      expect(directive['isActivated']()).toBe(true);
    });

    it('should return true when focused but not hovered', () => {
      directive['isHovered'] = false;
      directive['isFocused'] = true;
      expect(directive['isActivated']()).toBe(true);
    });

    it('should return true when both hovered and focused', () => {
      directive['isHovered'] = true;
      directive['isFocused'] = true;
      expect(directive['isActivated']()).toBe(true);
    });
  });

  describe('border behavior', () => {
    /**
     * Helper function to create a fresh fixture and get the directive instance.
     * This reduces code duplication in test setup.
     */
    function createFreshFixture(): LiquidGlassDirective {
      const newFixture = TestBed.createComponent(TestHostComponent);
      const directiveInstance = newFixture.debugElement
        .query(By.directive(LiquidGlassDirective))
        .injector.get(LiquidGlassDirective);
      newFixture.detectChanges();
      return directiveInstance;
    }

    it('should use --primary in normal state when lgBorder not provided', () => {
      // Arrange
      directive = createFreshFixture();

      // Act - ensure normal state (not hovered, not focused)
      directive['isHovered'] = false;
      directive['isFocused'] = false;
      directive['updateBorderColor']();

      // Assert
      const borderLayer = directive['borderLayer'];
      expect(borderLayer).toBeTruthy();
      expect(borderLayer.style.borderColor).toBe('var(--primary)');
    });

    it('should apply focus ring in activated state', () => {
      // Arrange
      directive = createFreshFixture();

      // Act - activate by hovering
      directive['isHovered'] = true;
      directive['updateBorderColor']();

      // Assert
      const borderLayer = directive['borderLayer'];
      const boxShadow = borderLayer.style.boxShadow;

      // Should contain the focus ring
      expect(boxShadow).toContain('0 0 0 3px');
      expect(boxShadow).toContain('oklch(from var(--primary)');
      expect(boxShadow).toContain('calc(l + 0.15)');
    });

    it('should preserve lgBorder in normal state', () => {
      // Arrange
      directive = createFreshFixture();
      const debugElement = fixture.debugElement.query(By.directive(LiquidGlassDirective));
      const nativeElement = debugElement.nativeElement;

      nativeElement.setAttribute('lgBorder', 'red');
      directive.lgBorder = 'red';
      fixture.detectChanges();

      // Act
      directive['isFocused'] = false;
      directive['updateBorderColor']();

      // Assert
      expect(directive['borderLayer'].style.borderColor).toBe('red');
    });

    it('should use primary focus ring even with custom lgBorder', () => {
      // Arrange
      directive = createFreshFixture();
      const debugElement = fixture.debugElement.query(By.directive(LiquidGlassDirective));
      const nativeElement = debugElement.nativeElement;

      nativeElement.setAttribute('lgBorder', 'blue');
      directive.lgBorder = 'blue';
      fixture.detectChanges();

      // Act - activate
      directive['isHovered'] = true;
      directive['updateBorderColor']();

      // Assert - border keeps custom color, but focus ring uses primary
      expect(directive['borderLayer'].style.borderColor).toBe('blue');

      const boxShadow = directive['borderLayer'].style.boxShadow;
      expect(boxShadow).toContain('var(--primary)'); // Focus ring uses primary
    });
  });
});
