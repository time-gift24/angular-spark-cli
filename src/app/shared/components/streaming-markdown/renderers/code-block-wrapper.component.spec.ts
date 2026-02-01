import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeBlockWrapperComponent } from './code-block-wrapper.component';
import { Component } from '@angular/core';
import { vi } from 'vitest';

describe('CodeBlockWrapperComponent', () => {
  let component: CodeBlockWrapperComponent;
  let fixture: ComponentFixture<CodeBlockWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeBlockWrapperComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlockWrapperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Required Inputs', () => {
    it('should require highlightedHtml input', () => {
      // Component should not render without required input
      expect(component.highlightedHtml).toBeUndefined();
    });

    it('should require code input', () => {
      expect(component.code).toBeUndefined();
    });

    it('should accept highlightedHtml input', () => {
      component.highlightedHtml = '<div class="shini">test</div>';
      fixture.detectChanges();

      expect(component.highlightedHtml).toBe('<div class="shini">test</div>');
    });

    it('should accept code input', () => {
      component.code = 'const x = 42;';
      fixture.detectChanges();

      expect(component.code).toBe('const x = 42;');
    });
  });

  describe('Optional Inputs with Defaults', () => {
    it('should have default language as "text"', () => {
      expect(component.language).toBe('text');
    });

    it('should have default theme as "light"', () => {
      expect(component.theme).toBe('light');
    });

    it('should have showLineNumbers default as true', () => {
      expect(component.showLineNumbers).toBe(true);
    });

    it('should have showCopyButton default as true', () => {
      expect(component.showCopyButton).toBe(true);
    });

    it('should have showLanguageTag default as true', () => {
      expect(component.showLanguageTag).toBe(true);
    });

    it('should have default copyButtonText', () => {
      expect(component.copyButtonText).toBe('Copy');
    });

    it('should have default copySuccessText', () => {
      expect(component.copySuccessText).toBe('已复制');
    });

    it('should accept custom language', () => {
      component.language = 'TypeScript';
      fixture.detectChanges();

      expect(component.language).toBe('TypeScript');
    });

    it('should accept dark theme', () => {
      component.theme = 'dark';
      fixture.detectChanges();

      expect(component.theme).toBe('dark');
    });

    it('should accept false for showLineNumbers', () => {
      component.showLineNumbers = false;
      fixture.detectChanges();

      expect(component.showLineNumbers).toBe(false);
    });

    it('should accept custom copy button text', () => {
      component.copyButtonText = 'Copy to Clipboard';
      fixture.detectChanges();

      expect(component.copyButtonText).toBe('Copy to Clipboard');
    });

    it('should accept custom success text', () => {
      component.copySuccessText = 'Copied!';
      fixture.detectChanges();

      expect(component.copySuccessText).toBe('Copied!');
    });
  });

  describe('Copy Button State', () => {
    it('should initialize with default copy state', () => {
      expect(component.copyButtonState()).toEqual({ type: 'default' });
    });

    it('should have copyFeedback computed signal', () => {
      expect(component.copyFeedback()).toBeDefined();
      expect(component.copyFeedback().defaultText).toBe('Copy');
      expect(component.copyFeedback().successText).toBe('已复制');
      expect(component.copyFeedback().errorText).toBe('复制失败');
      expect(component.copyFeedback().successDuration).toBe(2000);
    });

    it('should update copyFeedback when inputs change', () => {
      component.copyButtonText = 'Kopieren';
      component.copySuccessText = 'Kopiert!';
      fixture.detectChanges();

      expect(component.copyFeedback().defaultText).toBe('Kopieren');
      expect(component.copyFeedback().successText).toBe('Kopiert!');
    });
  });

  describe('Line Number Options', () => {
    it('should have lineNumberOptions computed signal', () => {
      expect(component.lineNumberOptions()).toBeDefined();
      expect(component.lineNumberOptions().startFrom).toBe(1);
      expect(component.lineNumberOptions().format).toBe('decimal');
    });
  });

  describe('Copy to Clipboard', () => {
    beforeEach(() => {
      // Set required inputs for copy functionality
      component.highlightedHtml = '<div class="shini">test</div>';
      component.code = 'const x = 42;';
      component.language = 'TypeScript';
      fixture.detectChanges();
    });

    describe('getCopyButtonText', () => {
      it('should return default text when in default state', () => {
        component.copyButtonState.set({ type: 'default' });
        expect(component['getCopyButtonText']()).toBe('Copy');
      });

      it('should return success text when in copied state', () => {
        component.copyButtonState.set({ type: 'copied' });
        expect(component['getCopyButtonText']()).toBe('已复制');
      });

      it('should return error text when in error state', () => {
        component.copyButtonState.set({ type: 'error', message: 'Failed' });
        expect(component['getCopyButtonText']()).toBe('复制失败');
      });

      it('should return N/A when in unavailable state', () => {
        component.copyButtonState.set({ type: 'unavailable' });
        expect(component['getCopyButtonText']()).toBe('N/A');
      });
    });

    describe('when Clipboard API is available', () => {
      beforeEach(() => {
        // Setup clipboard API mock
        Object.assign(navigator, {
          clipboard: {
            writeText: vi.fn().mockResolvedValue(undefined)
          }
        });
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should copy code to clipboard and show success state', async () => {
        // Mock Clipboard API
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

        // Call copy method
        component['copyToClipboard']();

        // Wait for promise microtasks to complete (process promises but not setTimeout)
        await Promise.resolve();
        fixture.detectChanges();

        // Verify clipboard was called with correct code
        expect(writeTextSpy).toHaveBeenCalledWith('const x = 42;');

        // Verify state changed to 'copied'
        expect(component.copyButtonState()).toEqual({ type: 'copied' });
      });

      it('should reset to default state after 2 seconds', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

        // Call copy method
        component['copyToClipboard']();

        // Process microtasks only
        await Promise.resolve();
        fixture.detectChanges();

        // Should be in 'copied' state
        expect(component.copyButtonState()).toEqual({ type: 'copied' });

        // Advance time by 2 seconds
        vi.advanceTimersByTime(2000);
        fixture.detectChanges();

        // Process pending timers
        await Promise.resolve();
        vi.runOnlyPendingTimers();
        fixture.detectChanges();

        // Should reset to 'default' state
        expect(component.copyButtonState()).toEqual({ type: 'default' });
      });

      it('should show error state when copy fails', async () => {
        // Mock clipboard error
        const error = new Error('Permission denied');
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(error);

        // Call copy method
        component['copyToClipboard']();

        // Wait for the promise rejection to be processed
        await vi.waitFor(() => {
          expect(component.copyButtonState().type).toBe('error');
        }, { timeout: 3000 });

        // Verify state changed to 'error' with message
        expect(component.copyButtonState()).toEqual({
          type: 'error',
          message: 'Permission denied'
        });
      });
    });

    describe('when Clipboard API is not available', () => {
      it('should set state to unavailable', () => {
        // Mock missing clipboard API
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
          configurable: true
        });

        // Call copy method
        component['copyToClipboard']();

        // Verify state changed to 'unavailable'
        expect(component.copyButtonState()).toEqual({ type: 'unavailable' });
      });
    });
  });
});

/**
 * Integration test: Component usage in a parent component
 */
@Component({
  standalone: true,
  imports: [CodeBlockWrapperComponent],
  template: `
    <app-code-block-wrapper
      [highlightedHtml]="html"
      [code]="rawCode"
      [language]="lang"
      [showLineNumbers]="showLines">
    </app-code-block-wrapper>
  `
})
class TestHostComponent {
  html = '<span class="keyword">const</span> x = 42;';
  rawCode = 'const x = 42;';
  lang = 'TypeScript';
  showLines = true;
}

describe('CodeBlockWrapperComponent Integration', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  it('should render in parent component', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const codeBlock = element.querySelector('app-code-block-wrapper');

    expect(codeBlock).toBeTruthy();
  });

  it('should pass inputs to child component', () => {
    fixture.detectChanges();

    const codeBlockElement = fixture.debugElement.children[0].componentInstance;

    expect(codeBlockElement.highlightedHtml).toBe(hostComponent.html);
    expect(codeBlockElement.code).toBe(hostComponent.rawCode);
    expect(codeBlockElement.language).toBe(hostComponent.lang);
    expect(codeBlockElement.showLineNumbers).toBe(hostComponent.showLines);
  });
});
