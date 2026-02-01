import { ChatMessage } from '../../../shared/models';

/**
 * 示例聊天消息数据
 */
export const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'system',
    content: '欢迎使用 AI 助手，我是基于 Claude 的智能助手。',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 分钟前
  },
  {
    id: '2',
    role: 'user',
    content: '你好，请介绍一下 Angular 20 的新特性。',
    timestamp: Date.now() - 1000 * 60 * 4,
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Angular 20 带来了许多激动人心的更新！\n\n1. **ZonelessAngular** - 完全移除 Zone.js，提供更好的性能\n2. **Signals** - 响应式编程模型，更加精细的变化检测\n3. **Standalone Components** - 默认开启，简化应用结构\n4. **新控制流语法** - @for, @if 等更直观的语法\n5. **改进的依赖注入** - 更灵活的 DI 系统\n\n你想深入了解哪个特性？',
    timestamp: Date.now() - 1000 * 60 * 3,
  },
  {
    id: '4',
    role: 'user',
    content: 'Signals 和 RxJS 有什么区别？',
    timestamp: Date.now() - 1000 * 60 * 2,
  },
  {
    id: '5',
    role: 'assistant',
    content: '这是一个很好的问题！Signals 和 RxJS 的主要区别：\n\n**Signals**:\n- 同步的值容器\n- 用于组件状态管理\n- 自动追踪依赖\n- 更简单的 API\n\n**RxJS**:\n- 异步数据流\n- 用于事件处理和 HTTP 请求\n- 强大的操作符链\n- 更适合复杂的数据流处理\n\n在现代 Angular 应用中，两者可以配合使用：Signals 管理状态，RxJS 处理异步操作。',
    timestamp: Date.now() - 1000 * 60 * 1,
  },
];

/**
 * 空消息示例
 */
export const emptyMessages: ChatMessage[] = [];

/**
 * 单条消息示例
 */
export const singleMessage: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: '你好！我是 AI 助手，有什么可以帮助你的吗？',
    timestamp: Date.now(),
  },
];

/**
 * 长对话示例
 */
export const longConversation: ChatMessage[] = [
  {
    id: '1',
    role: 'system',
    content: 'AI 助手已就绪',
    timestamp: Date.now() - 1000 * 60 * 10,
  },
  ...sampleMessages.slice(1),
  {
    id: '6',
    role: 'user',
    content: '能给我一个使用 Signals 的代码示例吗？',
    timestamp: Date.now() - 1000 * 60 * 0.5,
  },
  {
    id: '7',
    role: 'assistant',
    content: '当然！这是一个简单的 Signals 示例：\n\n```typescript\nimport { component, signal, computed } from \'@angular/core\';\n\n@Component({\n  selector: \'app-counter\',\n  template: `\n    <p>Count: {{ count() }}</p>\n    <p>Double: {{ doubleCount() }}</p>\n    <button (click)="increment()">+1</button>\n  `\n})\nexport class CounterComponent {\n  count = signal(0);\n  doubleCount = computed(() => count() * 2);\n\n  increment() {\n    count.update(v => v + 1);\n  }\n}\n```\n\nSignals 使用函数语法 `count()` 来读取值，使用 `update()` 或 `set()` 来修改值。Computed signals 会自动追踪依赖并重新计算。',
    timestamp: Date.now(),
  },
];
