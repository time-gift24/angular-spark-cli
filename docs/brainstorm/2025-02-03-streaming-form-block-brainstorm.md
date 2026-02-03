# Streaming Form Block - Design Document

**Date:** 2025-02-03
**Status:** Design Phase
**MVP Scope:** Phase 1 - Simple JSON Configuration

---

## 1. Overview

### Problem Statement
Enable AI assistants to request structured user input through interactive forms embedded directly in streaming markdown responses.

### Solution
Extend the `streaming-markdown` component to recognize and render `app-form` code blocks as interactive forms using simple JSON configuration.

### Design Principles
- **Simplicity First:** Lightweight JSON schema (MVP), extend later
- **Graceful Degradation:** Parse errors fall back to code block display
- **Type Safety:** Strong TypeScript types throughout
- **User Experience:** Seamless integration with streaming flow

---

## 2. MVP Scope

### ✅ Included Features

**Core Capabilities:**
1. Recognize ` ```app-form ` code blocks in markdown stream
2. Parse simple JSON configuration
3. Render 6 basic field types:
   - `text` - Text input
   - `email` - Email input
   - `textarea` - Multi-line text
   - `select` - Dropdown (single select)
   - `radio` - Radio button group (single select)
   - `checkbox` - Checkbox group (multi-select)
4. Basic validation (required fields, email format)
5. Form submission with event callback
6. Error handling with fallback display

**JSON Configuration Schema:**
```typescript
interface FormConfig {
  title: string
  fields: FormField[]
}

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "textarea" | "select" | "radio" | "checkbox"
  required?: boolean
  options?: string[]  // for select, radio, checkbox
}
```

**Example AI Output:**
```markdown
根据您的需求，我推荐以下方案...

```app-form
{
  "title": "联系我们",
  "fields": [
    {"name": "email", "label": "邮箱", "type": "email", "required": true},
    {"name": "message", "label": "留言", "type": "textarea"}
  ]
}
```

请填写上述表单，我们会尽快联系您。
```

### 🚫 Excluded (Future Work)

- Advanced validation rules (regex patterns, length limits)
- Conditional display logic (showIf, dependencies)
- Complex field types (date pickers, file uploads, rich text)
- Multi-step forms / wizards
- Form draft / state persistence
- Custom styling configuration
- LLM-assisted JSON repair

---

## 3. Architecture

### Component Structure

```
┌─────────────────────────────────────────────────┐
│  StreamingMarkdownComponent (Existing)         │
│  - Receives stream$ (markdown Observable)      │
│  - Parses to MarkdownBlock[]                   │
│  - Delegates to BlockRouter                    │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  MarkdownBlockRouter (Existing)                │
│  - Routes blocks by type                       │
│  - NEW: Recognizes "app-form" type             │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│  FormBlockComponent (NEW)                      │
│  - Receives form block data                    │
│  - Parses JSON configuration                   │
│  - Renders form fields                         │
│  - Handles submission logic                    │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
AI Stream (Text)
    ↓
stream$ (Observable<string>)
    ↓
StreamingMarkdownComponent.processChunk()
    ↓
BlockParser.parse()
    ↓
Detects: ```app-form
    ↓
Creates MarkdownBlock {
  type: "app-form",
  content: "{...JSON...}",
  id: "unique-id"
}
    ↓
FormBlockComponent receives block
    ↓
Parses JSON → FormConfig
    ↓
Renders form fields
    ↓
User fills → Submits
    ↓
@Output() formSubmit.emit(formData)
    ↓
Parent component handles data
```

### Data Models

```typescript
// Block data structure
interface MarkdownBlock {
  id: string
  type: "app-form" | "code" | "heading" | ...
  content: string  // JSON string for app-form
  metadata?: Record<string, unknown>
}

// Parsed form configuration
interface FormConfig {
  title: string
  fields: FormField[]
}

interface FormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
}

type FieldType = "text" | "email" | "textarea" | "select" | "radio" | "checkbox"

// Form submission data
interface FormData {
  [fieldName: string]: string | string[]
  // Example: {name: "张三", hobbies: ["阅读", "运动"]}
}
```

---

## 4. Implementation Details

### 4.1 BlockParser Extension

**Location:** `src/app/shared/components/streaming-markdown/core/block-parser.ts`

**Logic:**
```typescript
// Pseudo-code
function parseCodeBlock(line, remainingText) {
  const language = detectLanguage(line)

  if (language === "app-form") {
    const content = extractContent(remainingText)

    try {
      const json = JSON.parse(content)
      validateFormConfig(json)  // Basic validation

      return createMarkdownBlock({
        type: "app-form",
        content: content,
        id: generateUniqueId()
      })
    } catch (error) {
      // Fallback: treat as standard code block
      return parseStandardCodeBlock(line, remainingText)
    }
  }

  return parseStandardCodeBlock(line, remainingText)
}
```

**Key Points:**
- ` ```app-form ` is a special marker, not a real programming language
- Content must be valid JSON
- Parse errors fall back to standard code block display
- Returns `block.type = "app-form"` for router dispatch

---

### 4.2 FormBlockComponent

**Location:** `src/app/shared/components/streaming-markdown/blocks/form-block/`

**Component Structure:**
```typescript
@Component({
  selector: 'app-form-block',
  template: `
    <div class="form-block-container">
      <h3>{{ config().title }}</h3>

      @for (field of config().fields; track field.name) {
        <app-field-renderer
          [field]="field"
          [value]="formData()[field.name]"
          (valueChange)="updateField(field.name, $event)" />
      }

      <div class="form-actions">
        <button (click)="handleSubmit()">提交</button>
        <button (click)="handleCancel()">取消</button>
      </div>
    </div>
  `
})
export class FormBlockComponent {
  @Input() block!: MarkdownBlock
  @Input() isComplete!: boolean
  @Output() formSubmit = new EventEmitter<FormData>()

  protected config = signal<FormConfig>({})
  protected formData = signal<FormData>({})

  ngOnInit() {
    this.parseBlockContent()
  }

  private parseBlockContent() {
    try {
      const json = JSON.parse(this.block.content)
      this.config.set(json)
    } catch (error) {
      // Handle parse error (fallback display)
    }
  }

  protected handleSubmit() {
    // Validate required fields
    // Emit formSubmit event
    this.formSubmit.emit(this.formData())
  }
}
```

---

### 4.3 Field Renderer Component

**Responsibilities:**
- Dispatch to specific field components based on `field.type`
- Handle two-way binding
- Display labels and required indicators
- Show inline validation errors

**Dispatch Logic:**
```typescript
@Switch(field.type) {
  @Case('text'): return TextFieldComponent
  @Case('email'): return EmailFieldComponent
  @Case('textarea'): return TextareaFieldComponent
  @Case('select'): return SelectFieldComponent
  @Case('radio'): return RadioFieldComponent
  @Case('checkbox'): return CheckboxFieldComponent
}
```

**Field Component Interface:**
```typescript
interface BaseFieldComponent {
  @Input() field: FormField
  @Input() value: string | string[]
  @Output() valueChange: EventEmitter<string | string[]>

  // Optional: validation state
  @Input() error?: string
}
```

---

### 4.4 Form Submission Flow

```
User clicks [Submit]
    ↓
FormBlockComponent.handleSubmit()
    ↓
Collect formData from all fields
    ↓
Run basic validation:
  - Check required fields have values
  - Check email fields contain "@"
    ↓
Validation failed?
  ├── Yes: Show error message, prevent submit
  └── No: Continue
    ↓
Emit @Output() formSubmit.emit(formData)
    ↓
Parent component receives data
    ↓
Send to AI / API
    ↓
AI continues streaming response
```

**UI Feedback:**
- Submit button shows loading state during submission
- Success: Hide form, show "✓ Submitted"
- Failure: Show error message, enable retry

**Submitted Data Format:**
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "gender": "男",
  "hobbies": ["阅读", "运动"]
}
```

---

## 5. Error Handling

### Error Scenarios

| Error Type | Description | Fallback Strategy |
|-----------|-------------|-------------------|
| **JSON Parse Error** | app-form content is not valid JSON | Display as standard code block |
| **Config Validation** | Missing required fields (name, type) | Show error message + display code block |
| **Unsupported Type** | field.type not in supported list | Show error, render as text field |
| **Form Validation** | required field empty, invalid email | Block submission, show inline error |
| **Submission Error** | Network failure / API error | Show error message, allow retry |

### Error Handling Logic

```typescript
// FormBlockComponent
try {
  const config = JSON.parse(this.block.content)
  validateFormConfig(config)
  this.renderForm(config)
} catch (error) {
  if (error instanceof JSONParseError) {
    // Fallback: display as code block
    this.renderAsCodeBlock(this.block.content)
  } else if (error instanceof ValidationError) {
    // Show config error
    this.showError("表单配置无效: " + error.message)
    this.renderAsCodeBlock(this.block.content)
  }
}
```

**Error Display:**
```html
<div class="form-error">
  ⚠️ 表单配置无效: <error-message>

  <pre><code>{{ block.content }}</code></pre>
</div>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**BlockParser:**
```typescript
describe('BlockParser - app-form', () => {
  it('should parse valid app-form block')
  it('should fallback to code block on invalid JSON')
  it('should validate required config fields')
  it('should reject unsupported field types')
  it('should handle multiple app-form blocks')
})
```

**FormBlockComponent:**
```typescript
describe('FormBlockComponent', () => {
  it('should render all 6 field types')
  it('should validate required fields')
  it('should bind form data correctly')
  it('should emit formSubmit with correct data')
  it('should fallback on parse error')
})
```

**Field Components:**
```typescript
describe('TextFieldComponent', () => {
  it('should bind input value')
  it('should emit valueChange on input')
})

describe('EmailFieldComponent', () => {
  it('should validate email format')
})

// ... similar for other field types
```

---

### 6.2 Integration Tests

**Complete Flow:**
```typescript
describe('Form Block Integration', () => {
  it('should render form from markdown stream', () => {
    const markdown = `
      Some text...

      \`\`\`app-form
      {"title": "Test", "fields": [...]}
      \`\`\`

      More text...
    `

    // Assert: Form renders correctly
    // Assert: Fields are interactive
    // Assert: Submission emits correct data
  })

  it('should fallback on invalid JSON', () => {
    const markdown = '```app-form\n{invalid}\n```'

    // Assert: Displays as code block
    // Assert: No uncaught errors
  })
})
```

---

### 6.3 E2E Tests

**User Journey:**
```typescript
describe('Form Submission E2E', () => {
  it('should complete AI form request flow', () => {
    // 1. User sends message to AI
    // 2. AI responds with form
    // 3. User fills form
    // 4. User submits
    // 5. AI receives data and continues
  })
})
```

---

### 6.4 Test Coverage Targets

- **Unit Tests:** > 80%
- **Integration Tests:** Core flows 100%
- **E2E Tests:** Critical user paths

---

## 7. Future/Divergent Ideas

This section contains features that were discussed but deemed out of scope for the MVP. These may be implemented in future phases.

### Phase 2 Enhancements

**1. Advanced Validation**
- Regex pattern validation
- Min/max length constraints
- Custom validation functions
- Real-time validation feedback

**2. Conditional Logic**
- `showIf` field dependencies
- `enableIf` conditional enabling
- Dynamic field visibility

**3. Complex Field Types**
- Date pickers
- File uploads
- Rich text editors
- Color pickers
- Slider inputs

**4. Multi-Step Forms**
- Form wizard UX
- Step progress indicator
- Cross-step validation

**5. Form State Management**
- Draft auto-save
- Resume incomplete forms
- Form history / versions

**6. LLM-Assisted Repair**
- Auto-detect malformed JSON
- Request LLM to fix syntax errors
- Retry parsing with corrected JSON

**7. Custom Styling**
- Theme configuration
- Custom CSS classes
- Layout options (inline, grid)

**8. Analytics & Telemetry**
- Form completion rates
- Field interaction tracking
- Submission success/failure metrics

---

## 8. Implementation Checklist

### Core Components
- [ ] Extend `BlockParser` to recognize `app-form` blocks
- [ ] Create `FormBlockComponent`
- [ ] Create field renderer dispatcher
- [ ] Implement 6 field components (text, email, textarea, select, radio, checkbox)
- [ ] Add form validation logic
- [ ] Implement form submission flow
- [ ] Add error handling and fallback display

### Testing
- [ ] Unit tests for BlockParser extension
- [ ] Unit tests for FormBlockComponent
- [ ] Unit tests for all field components
- [ ] Integration tests for complete flow
- [ ] E2E tests for user journey

### Documentation
- [ ] Component API documentation
- [ ] Usage examples
- [ ] JSON schema reference
- [ ] Migration guide (if needed)

---

## 9. Technical Decisions

### Why `app-form` over custom syntax?
- **Pros:** Leverages existing code block parsing, familiar to markdown users
- **Cons:** Slightly verbose compared to custom syntax
- **Decision:** Acceptable trade-off for simplicity and compatibility

### Why simple JSON over DSL?
- **Pros:** Easy to parse, validate, and debug; AI-friendly
- **Cons:** Limited expressiveness
- **Decision:** Start simple, extend later (YAGNI principle)

### Why fallback on parse error?
- **Pros:** Graceful degradation, user sees content even if broken
- **Cons:** May hide configuration errors
- **Decision:** Better UX than silent failure or blank screen

---

## 10. Open Questions

1. **Form Styling:** Should forms inherit streaming-markdown styles or have custom styling?
   - **Recommendation:** Start with inherited styles, add custom theming in Phase 2

2. **Accessibility:** What ARIA labels and keyboard navigation support is needed?
   - **Recommendation:** Follow WCAG AA guidelines from design system

3. **Multiple Forms:** Should we support multiple forms in one stream?
   - **Recommendation:** Support for flexibility, validate in testing

4. **Form Reset:** Can users reset/clear forms? How is this triggered?
   - **Recommendation:** Add [Reset] button next to [Submit]

---

## Appendix A: Example Usage

### Parent Component Integration

```typescript
@Component({
  template: `
    <app-streaming-markdown
      [stream$]="aiResponse$"
      (rawContentChange)="handleContentChange($event)">
    </app-streaming-markdown>
  `
})
export class ChatComponent {
  aiResponse$: Observable<string>

  constructor(private aiService: AIService) {}

  sendMessage(userMessage: string) {
    this.aiResponse$ = this.aiService.streamResponse(userMessage)
  }

  // FormBlockComponent will emit formSubmit event
  // Parent component can listen via custom event bus or service
}
```

### Example AI Interactions

**Scenario 1: Contact Form**
```markdown
I'll help you get in touch with our support team. Please provide your details:

```app-form
{
  "title": "联系支持团队",
  "fields": [
    {"name": "email", "label": "邮箱地址", "type": "email", "required": true},
    {"name": "category", "label": "问题类型", "type": "select", "options": ["技术问题", "账单问题", "其他"], "required": true},
    {"name": "message", "label": "详细描述", "type": "textarea", "required": true}
  ]
}
```

Once you submit this form, I'll create a support ticket for you.
```

**Scenario 2: User Preferences**
```markdown
Let me customize your experience. Please select your preferences:

```app-form
{
  "title": "用户偏好设置",
  "fields": [
    {"name": "theme", "label": "主题", "type": "radio", "options": ["浅色", "深色", "自动"]},
    {"name": "notifications", "label": "通知偏好", "type": "checkbox", "options": ["邮件", "短信", "推送通知"]}
  ]
}
```

I'll apply these settings to your account.
```

---

## Appendix B: JSON Schema Reference

### Complete Schema

```typescript
interface FormConfig {
  title: string                    // Form title (displayed as heading)
  fields: FormField[]              // Array of form fields
}

interface FormField {
  name: string                     // Field identifier (used in submitted data)
  label: string                    // Human-readable label
  type: FieldType                  // Field type
  required?: boolean               // Is field required? (default: false)
  options?: string[]               // Options for select/radio/checkbox
}

type FieldType =
  | "text"       // Single-line text input
  | "email"      // Email input (with basic validation)
  | "textarea"   // Multi-line text input
  | "select"     // Dropdown (single select)
  | "radio"      // Radio button group (single select)
  | "checkbox"   // Checkbox group (multi-select)
```

### Validation Rules

**Required Fields:**
- `name` - Required, must be unique within form
- `label` - Required
- `type` - Required, must be one of 6 supported types

**Conditional Fields:**
- `options` - Required for `select`, `radio`, `checkbox` types
- `required` - Optional, defaults to `false`

### Constraints

- Minimum 1 field per form
- Maximum 20 fields per form (configurable)
- Field names must be valid JavaScript identifiers
- Options arrays must have 2-10 items (for UX)

---

**Document Version:** 1.0
**Last Updated:** 2025-02-03
**Status:** Ready for Implementation Planning
