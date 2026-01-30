# Baseline Test Results: Scenario 1 (Button Component)

## Test Date
2026-01-30

## Agent Behavior (Without Skill)

### What Agent Did Right
✓ Created standalone Angular component
✓ Used Signals (input(), computed())
✓ Implemented multiple variants and sizes
✓ Added accessibility features
✓ Created comprehensive documentation

### Actual Violations Found

#### 1. **Wrong Tailwind Version Pattern**
- **What happened**: Created `tailwind.config.ts` with v3 pattern
- **Expected for v4**: Use `@theme` directive in `src/styles.css`
- **Impact**: Loses type safety and new v4 features
- **Quote**: "Added custom color mappings using CSS variables" in config file

#### 2. **Introduced React Ecosystem Library**
- **What happened**: Installed `class-variance-authority` (CVA)
- **Problem**: CVA is React-specific, not suitable for Angular
- **Better approach**: Use Angular computed() for variants
- **Rationalization**: "For managing component variants"

#### 3. **CSS Variables Instead of @theme Tokens**
- **What happened**: Defined `--primary: hsl(...)` in styles.css
- **Problem**: Not integrated with Tailwind v4's type system
- **Expected**: `@theme { --color-primary-500: hsl(...); }`
- **Impact**: No autocomplete, no type safety

#### 4. **Manual Class Merging Instead of Framework Features**
- **What happened**: Created `cn()` utility function (clsx/tailwind-merge pattern)
- **Problem**: This is a React pattern, Angular has better ways
- **Expected**: Use computed() with template literals directly

#### 5. **Skipped MCP Usage**
- **What happened**: Didn't attempt to use shadcn MCP even though available
- **Rationalization**: Assumed not available based on test constraints
- **Impact**: Missing actual shadcn implementation details

## Key Insights

### Primary Anti-Patterns to Address
1. Using Tailwind v3 config pattern in v4 project
2. Bringing React libraries into Angular project
3. Not using `@theme` for token definitions
4. React mental models dominating implementation choices

### What the Skill Must Teach
- How to use Tailwind CSS v4 `@theme` directive
- Angular-native patterns vs React patterns
- When and how to use shadcn MCP
- Signal-based variant management (no CVA needed)

## Pressure Points Observed
- Time pressure: "快速实现" → Created working solution quickly
- Completeness pressure: "完全一样" → Added many features
- Tool familiarity: Used known React patterns instead of learning v4

## Documentation of Rationalizations
| Agent Action | Rationalization | Reality |
|--------------|----------------|---------|
| Created tailwind.config.ts | "This is how you configure Tailwind" | Wrong for v4 |
| Installed CVA | "For managing component variants" | React-specific, use computed() |
| Manual CSS vars | "For theming support" | @theme provides type-safe theming |
| cn() utility | "To merge classes conditionally" | Template literals work fine |

## Next Steps for Skill
1. MUST teach `@theme` directive as primary pattern
2. FORBID React-specific libraries (CVA, clsx, etc.)
3. REQUIRE MCP usage as first step
4. TEACH computed() for variant management
