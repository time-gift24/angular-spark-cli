import { Component, Input, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BLOCK_COMPONENT_REGISTRY, BlockComponentRegistry, STREAMDOWN_PLUGIN_RUNTIME, StreamdownPluginRuntime } from '../../core/plugin';
import { BlockType, MarkdownBlock, ParagraphBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from './block-router.component';

@Component({
  selector: 'app-hook-probe-a',
  standalone: true,
  template: '<div class="hook-probe-a">A</div>'
})
class HookProbeAComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete = true;
}

@Component({
  selector: 'app-hook-probe-b',
  standalone: true,
  template: '<div class="hook-probe-b">B</div>'
})
class HookProbeBComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete = true;
}

@Component({
  selector: 'app-router-hook-host',
  standalone: true,
  imports: [MarkdownBlockRouterComponent],
  template: '<app-markdown-block-router [block]="block" [isComplete]="true" [blockIndex]="0" />'
})
class RouterHookHostComponent {
  block: ParagraphBlock = {
    id: 'p-0',
    type: BlockType.PARAGRAPH,
    content: 'hello',
    isComplete: true,
    position: 0
  };
}

class FakePluginRuntime implements StreamdownPluginRuntime {
  readonly registry: BlockComponentRegistry;
  readonly observability = {
    increment: (_counter: import('../../core/plugin').PluginCounter, _pluginName?: string) => {},
    recordConflict: () => {},
    snapshot: () => ({
      lifecycleInitCalls: 0,
      lifecycleDestroyCalls: 0,
      beforeRenderCalls: 0,
      afterRenderCalls: 0,
      parserExtensionCalls: 0,
      parserExtensionFallbacks: 0,
      inlineExtensionCalls: 0,
      inlineExtensionFallbacks: 0,
      errors: 0,
      conflicts: []
    })
  };

  readonly hasBeforeRenderHooks = true;
  readonly hasAfterRenderHooks = true;

  beforeCalls = 0;
  afterCalls = 0;

  constructor(registry: BlockComponentRegistry) {
    this.registry = registry;
  }

  initialize(): void {
    return;
  }

  destroy(): void {
    return;
  }

  runBeforeRender(context: import('../../core/plugin').RenderHookContext): void {
    this.beforeCalls += 1;
    context.component = HookProbeBComponent;
  }

  runAfterRender(_context: import('../../core/plugin').RenderHookContext): void {
    this.afterCalls += 1;
  }
}

describe('MarkdownBlockRouterComponent plugin render hooks', () => {
  it('applies before/after render hooks via plugin runtime', async () => {
    const registry: BlockComponentRegistry = {
      componentMap: new Map<string, any>([
        [BlockType.PARAGRAPH, HookProbeAComponent],
        [BlockType.UNKNOWN, HookProbeAComponent]
      ]),
      matchers: [],
      parserExtensions: []
    };
    const runtime = new FakePluginRuntime(registry);

    await TestBed.configureTestingModule({
      imports: [RouterHookHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: BLOCK_COMPONENT_REGISTRY, useValue: registry },
        { provide: STREAMDOWN_PLUGIN_RUNTIME, useValue: runtime }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(RouterHookHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.hook-probe-a')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.hook-probe-b')).toBeTruthy();
    expect(runtime.beforeCalls).toBe(1);
    expect(runtime.afterCalls).toBe(1);
  });

  it('uses matcher blockResolver to pick component key', async () => {
    const registry: BlockComponentRegistry = {
      componentMap: new Map<string, any>([
        [BlockType.PARAGRAPH, HookProbeAComponent],
        ['secondary', HookProbeBComponent],
        [BlockType.UNKNOWN, HookProbeAComponent]
      ]),
      matchers: [
        {
          pluginName: 'resolver-plugin',
          matcher: () => true,
          resolveType: () => 'secondary',
          components: {
            secondary: HookProbeBComponent
          }
        }
      ],
      parserExtensions: []
    };

    await TestBed.configureTestingModule({
      imports: [RouterHookHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: BLOCK_COMPONENT_REGISTRY, useValue: registry }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(RouterHookHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.hook-probe-a')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.hook-probe-b')).toBeTruthy();
  });
});
