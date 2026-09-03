# daisyUI Integration Guide

## Overview
This guide explains how to integrate daisyUI into the Goiaba mobile app to enhance UI/UX while maintaining compatibility with Ionic components.

## Why daisyUI?

- **65+ pre-built components** for standard HTML elements
- **Theme system** with 30+ themes (can customize to match Goiaba brand)
- **Semantic color system** that works with your existing colors
- **88% fewer class names** for common components
- **Works alongside Ionic** - doesn't replace Ionic components

## Installation

```bash
yarn add -D daisyui@latest
```

## Configuration

### 1. Update `tailwind.config.cjs`

Add daisyUI to your plugins array and configure it to work with your brand colors:

```javascript
module.exports = {
  content: ['./src/**/*.{html,ts,scss}', './src-default/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      // ... your existing theme config
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('daisyui'), // Add daisyUI
  ],
  daisyui: {
    themes: [
      {
        goiaba: {
          "primary": "#FF6B35",      // Goiaba primary
          "secondary": "#F7931E",     // Goiaba secondary
          "accent": "#FFD23F",       // Goiaba accent
          "neutral": "#525252",      // Your neutral-600
          "base-100": "#FFFFFF",     // White background
          "base-200": "#FAFAFA",     // Your neutral-50
          "base-300": "#F5F5F5",     // Your neutral-100
          "info": "#3B82F6",         // Your info-500
          "success": "#22C55E",      // Your success-500
          "warning": "#F59E0B",      // Your warning-500
          "error": "#EF4444",        // Your error-500
        },
      },
      "light",  // Keep light theme as fallback
      "dark",   // Keep dark theme as fallback
    ],
    base: true,        // Apply base styles
    styled: true,      // Include component styles
    utils: true,       // Include utility classes
    prefix: "",        // No prefix (use standard daisyUI classes)
    logs: true,        // Show daisyUI logs in console
    themeRoot: ":root", // Root element for theme variables
  },
};
```

### 2. Update `tailwind.scss`

No changes needed! daisyUI will work with your existing Tailwind setup.

## Usage Strategy

### ✅ Use daisyUI For:
- **Standard HTML elements** (divs, buttons, inputs, etc.)
- **Web-only components** (modals, dropdowns, tooltips)
- **Form elements** (checkboxes, radios, selects)
- **Data display** (tables, badges, stats)
- **Layout components** (hero sections, footers)

### ❌ Keep Ionic For:
- **Mobile-specific components** (ion-button, ion-card, ion-item)
- **Native-feeling interactions** (ion-modal, ion-action-sheet)
- **Platform-specific UI** (ion-tabs, ion-header)

## Examples

### Example 1: Replace Custom Card with daisyUI Card

**Before (Custom):**
```html
<div class="card-modern">
  <div class="card-modern-header">
    <h3>Product Title</h3>
  </div>
  <div class="card-modern-content">
    <p>Product description</p>
  </div>
</div>
```

**After (daisyUI):**
```html
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Product Title</h2>
    <p>Product description</p>
  </div>
</div>
```

### Example 2: Use daisyUI Button for Web Elements

**For standard HTML buttons:**
```html
<button class="btn btn-primary">Click Me</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
```

**For Ionic buttons (keep as is):**
```html
<ion-button class="button-solid">Ionic Button</ion-button>
```

### Example 3: Form Elements

**daisyUI Input:**
```html
<input type="text" placeholder="Email" class="input input-bordered w-full max-w-xs" />
<input type="text" placeholder="Disabled" class="input input-bordered w-full max-w-xs input-disabled" />
```

**daisyUI Checkbox:**
```html
<input type="checkbox" checked="checked" class="checkbox checkbox-primary" />
```

### Example 4: Badge/Status

**Before:**
```html
<span class="px-2 py-1 bg-goiaba-primary text-white rounded">New</span>
```

**After:**
```html
<div class="badge badge-primary">New</div>
<div class="badge badge-success">In Stock</div>
<div class="badge badge-error">Out of Stock</div>
```

## Theme Customization

### Apply Goiaba Theme

Add to your root component or `global.scss`:

```scss
:root {
  // daisyUI will use the "goiaba" theme by default
  // You can switch themes dynamically:
  // data-theme="goiaba" (default)
  // data-theme="dark"
  // data-theme="light"
}
```

### Dynamic Theme Switching

```typescript
// In your theme service
setTheme(themeName: string) {
  document.documentElement.setAttribute('data-theme', themeName);
}
```

## Migration Strategy

### Phase 1: Add daisyUI (No Breaking Changes)
1. Install daisyUI
2. Configure theme
3. Test existing components still work
4. ✅ No changes to existing code

### Phase 2: Gradual Adoption
1. Use daisyUI for **new components**
2. Replace custom classes **where it makes sense**
3. Keep Ionic components **as-is**
4. Document which components use daisyUI

### Phase 3: Optimization
1. Remove unused custom component classes
2. Standardize on daisyUI for HTML elements
3. Keep Ionic for mobile-specific UI

## Component Mapping

| Current Custom Class | daisyUI Equivalent | Use Case |
|---------------------|-------------------|----------|
| `.card-modern` | `.card` | Standard cards |
| `.btn-primary` | `.btn.btn-primary` | HTML buttons |
| `.input-modern` | `.input.input-bordered` | Form inputs |
| `ion-button` | Keep as-is | Mobile buttons |
| `ion-card` | Keep as-is | Mobile cards |

## Best Practices

1. **Use daisyUI for web elements, Ionic for mobile**
2. **Maintain brand consistency** - customize daisyUI theme to match Goiaba colors
3. **Don't mix unnecessarily** - if Ionic works, keep it
4. **Test on mobile** - ensure daisyUI components are touch-friendly
5. **Use semantic classes** - `btn-primary` is clearer than `bg-goiaba-primary`

## Benefits for Goiaba

1. **Faster development** - pre-built components reduce custom CSS
2. **Consistent design** - daisyUI's design system ensures consistency
3. **Theme support** - easy dark mode and theme switching
4. **Smaller bundle** - Tailwind purging removes unused styles
5. **Better maintainability** - semantic class names are self-documenting

## Potential Issues & Solutions

### Issue: daisyUI conflicts with Ionic
**Solution:** Use daisyUI only for standard HTML elements, not Ionic components

### Issue: Theme colors don't match
**Solution:** Customize daisyUI theme in `tailwind.config.cjs` to use Goiaba colors

### Issue: Bundle size increase
**Solution:** Tailwind's purging will remove unused daisyUI styles automatically

## Next Steps

1. ✅ Install daisyUI: `yarn add -D daisyui@latest`
2. ✅ Update `tailwind.config.cjs` with daisyUI config
3. ✅ Test existing components still work
4. ✅ Start using daisyUI in new components
5. ✅ Gradually migrate existing components (optional)

## Resources

- [daisyUI Documentation](https://daisyui.com/)
- [daisyUI Components](https://daisyui.com/components/)
- [daisyUI Theme Generator](https://daisyui.com/theme-generator/)
- [daisyUI + Angular Examples](https://daisyui.com/frameworks/angular/)
