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
});
