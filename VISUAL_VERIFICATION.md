# Visual Verification Checklist

## Date: 2026-02-05

### Normal State
- [x] Border color is Malachite green (石绿)
- [x] Matches input component border color
- [x] Light theme verified

### Activated State
- [x] Focus ring appears on hover
- [x] Focus ring appears on keyboard focus
- [x] Focus ring color is lightened primary
- [x] Depth shadow preserved
- [x] Focus ring disappears on deactivate

### Custom Border
- [x] lgBorder custom color works in normal state
- [x] Focus ring uses primary even with custom border

### Consistency
- [x] Liquid-glass matches input behavior
- [x] Design system consistency achieved

**Result:** PASS

**Notes:**
- Border color correctly changed from Gold (--accent) to Malachite green (--primary)
- Focus ring appears with 3px offset and lightened primary color
- Visual alignment with input component achieved
- Both mouse and keyboard focus work correctly
