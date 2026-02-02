# LLM 服务集成设计文档

**日期：** 2026-02-02
**设计目标：** 在 Angular 项目中集成 OpenAI 和 Ollama 大模型服务，支持流式输出

---

## 1. MVP 范围

### ✅ 包含功能
- 统一的服务层接口（`LlmService`）
- 支持两个提供商：OpenAI 和 Ollama
- 基础对话输入（单次请求）
- 流式响应输出（SSE）
- 可配置切换提供商（通过依赖注入）

### ❌ MVP 阶段不包含
- 多轮对话历史管理
- 自动重试机制
- 复杂错误分类
- UI 组件（仅服务层）

---

## 2. 架构设计：适配器模式

### 目录结构

```
src/app/shared/services/llm/
├── llm.service.ts                    # 统一服务接口
├── providers/
│   ├── llm-provider.adapter.ts       # 适配器抽象类
│   ├── openai.adapter.ts             # OpenAI 适配器
│   └── ollama.adapter.ts             # Ollama 适配器
├── models/
│   ├── llm-config.model.ts           # 配置模型
│   ├── llm-message.model.ts          # 消息模型
│   └── llm-response.model.ts         # 响应模型
└── tokens/
    └── llm-config.token.ts           # 配置 DI Token
```

### 核心组件

#### 2.1 LlmService（统一服务接口）
**职责：** 对外提供统一的 LLM 调用接口，内部根据配置选择适配器

```typescript
class LlmService {
  constructor(
    @Inject(LLM_CONFIG) private config: LlmProviderConfig
  ) {}

  // 核心方法：流式对话
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    // 1. 根据 config.type 选择适配器
    // 2. 调用 adapter.streamChat()
    // 3. 返回 Observable
  }
}
```

#### 2.2 LlmProviderAdapter（适配器抽象类）
**职责：** 定义所有提供商适配器必须实现的接口

```typescript
abstract class LlmProviderAdapter {
  abstract streamChat(messages: LlmMessage[]): Observable<StreamChunk>
  protected abstract buildRequest(messages: LlmMessage[]): any
  protected abstract parseStream(chunk: string): StreamChunk
}
```

#### 2.3 具体适配器实现

**OpenAIAdapter**
- 使用 `HttpClient` 调用 OpenAI API
- `baseUrl`: `https://api.openai.com/v1`
- 需要认证：`Authorization: Bearer {apiKey}`
- 流式格式：Server-Sent Events (SSE)

**OllamaAdapter**
- 使用 `HttpClient` 调用 Ollama API
- `baseUrl`: `http://localhost:11434`
- 无需认证
- 流式格式：兼容 OpenAI SSE 格式

---

## 3. 数据模型

### 3.1 LlmProviderConfig（提供商配置）
```typescript
interface LlmProviderConfig {
  type: 'openai' | 'ollama'           // 提供商类型
  baseUrl: string                      // API 端点
  model: string                        // 模型名称（如 gpt-4o, llama3.2）
  apiKey?: string                      // API 密钥（Ollama 不需要）
  temperature?: number                 // 温度参数（可选，0-2）
}
```

### 3.2 LlmMessage（消息格式）
```typescript
interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
```

### 3.3 StreamChunk（流式响应块）
```typescript
interface StreamChunk {
  content: string          // 本次文本块内容
  done: boolean            // 流是否完成
  error?: Error            // 错误信息（如果有）
}
```

---

## 4. 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入消息                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Component 调用：                                                 │
│  llmService.streamChat([{role: 'user', content: '你好'}])        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  LlmService 检查 providerConfig.type                             │
│  → 'openai' → 选择 OpenAIAdapter                                 │
│  → 'ollama' → 选择 OllamaAdapter                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Adapter 构建 HTTP 请求：                                         │
│  POST /chat/completions                                          │
│  Headers:                                                        │
│    - Content-Type: application/json                              │
│    - Authorization: Bearer {apiKey} (仅 OpenAI)                  │
│  Body: {model, messages, stream: true}                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  监听 Server-Sent Events (text/event-stream)                     │
│  解析每个 data: chunk                                            │
│  提取 delta.content                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  通过 Observable<StreamChunk> emit：                              │
│  {content: '你', done: false}                                    │
│  {content: '好', done: false}                                    │
│  {content: '！', done: false}                                    │
│  {content: '', done: true}                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Component 订阅 Observable，逐块更新 UI                          │
│  stream$.subscribe(chunk => {                                    │
│    if (chunk.error) 显示错误                                     │
│    else if (!chunk.done) 累加文本到界面                           │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 错误处理

### 错误类型与处理策略

| 错误类型 | 检测时机 | 处理方式 |
|---------|---------|---------|
| **配置错误** | 服务初始化时 | 同步抛出异常，阻止初始化 |
| **网络错误** | HTTP 请求失败 | Observable emit `{done: true, error: Error}` |
| **API 错误** | 流式响应中 | 同网络错误 |
| **解析错误** | 解析 SSE 数据时 | 中断流 + 返回部分结果 + error |

### MVP 简化策略
- ✅ 基础错误传递（通过 `StreamChunk.error`）
- ✅ 依赖调用方（Component）决定如何展示错误
- ❌ 不做自动重试
- ❌ 不做详细错误分类

---

## 6. 使用示例

### 6.1 配置提供商（在 app.config.ts 或组件中）

```typescript
// OpenAI 配置
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiKey: 'sk-xxx',
    temperature: 0.7
  } as LlmProviderConfig
}

// 或 Ollama 配置
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2'
  } as LlmProviderConfig
}
```

### 6.2 在组件中使用

```typescript
export class ChatComponent {
  response = '';

  constructor(private llmService: LlmService) {}

  sendMessage(userInput: string) {
    const messages: LlmMessage[] = [
      {role: 'user', content: userInput}
    ];

    this.llmService.streamChat(messages).subscribe({
      next: (chunk) => {
        if (chunk.error) {
          console.error('LLM Error:', chunk.error);
        } else if (!chunk.done) {
          this.response += chunk.content;  // 累加流式文本
        }
      },
      error: (err) => console.error('Stream error:', err)
    });
  }
}
```

---

## 7. 技术要点

### 7.1 HTTP 流式请求
- Angular `HttpClient` 支持 `responseType: 'text'`
- SSE 格式：`data: {...}\n\n`
- 使用 RxJS `Observable` 包装流式响应

### 7.2 Ollama 兼容性
- Ollama API 兼容 OpenAI 的 `/chat/completions` 端点
- 返回格式基本一致，可以在适配器层统一处理

### 7.3 依赖注入
- 使用 Angular DI 管理配置
- 方便测试和切换提供商

---

## 8. 未来扩展（Parking Lot）

以下功能在 MVP 阶段不实现，记录为未来计划：

### 8.1 多轮对话历史
- 在服务层管理 `messages` 数组
- 自动添加上下文消息
- 支持对话历史持久化

### 8.2 更多提供商
- 通义千问（阿里云）
- 文心一言（百度）
- 智谱 AI（GLM）
- Anthropic Claude

### 8.3 高级功能
- 自动重试机制（指数退避）
- 请求去重
- 流量控制（限流）
- 缓存策略

### 8.4 开发者工具
- 流量监控面板
- Token 使用统计
- 性能分析工具

---

## 9. 依赖库

### 生产依赖
- `@angular/common`: HttpClient
- `rxjs`: Observable

### 可选依赖（暂未确定）
- `openai`: 官方 OpenAI SDK（考虑是否使用）
- **决策点：** 直接使用 `HttpClient` 还是引入 SDK？
  - 使用 SDK：功能完整，但增加依赖
  - 使用 HttpClient：更轻量，完全控制

**MVP 阶段建议：** 直接使用 `HttpClient`，更轻量且符合适配器模式理念。

---

## 10. 测试策略

### 单元测试
- Mock `HttpClient` 测试适配器
- 测试流式解析逻辑
- 测试错误处理

### 集成测试
- 使用真实的 Ollama 本地服务测试
- OpenAI 需要使用 mock server

### E2E 测试
- 测试完整的流式响应流程
- 测试 UI 更新逻辑

---

**设计完成。下一步：** 创建实施计划。
