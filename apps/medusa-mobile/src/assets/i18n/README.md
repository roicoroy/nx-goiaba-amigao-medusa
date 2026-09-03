# Translation Files - Naming Convention

## Key Naming Convention

All translation keys use **lowercase with underscores (snake_case)** and dot notation for nested structures.

### Pattern
```
feature.component.element.action
```

### Examples
- `home.hero.title` instead of `HOME_PAGE.HERO.TITLE`
- `find_us.page.visit_us` instead of `FIND_US_PAGE.VISIT_US`
- `contact_us.form.name.placeholder` instead of `CONTACT_US_PAGE.FORM.NAME_PLACEHOLDER`
- `settings.description` instead of `SETTINGS_DESCRIPTION`

### Benefits
1. **Readability**: Easier to read and understand
2. **Tooling**: Better support from translation extraction tools
3. **Variables**: Works seamlessly with interpolation
4. **Consistency**: Single standard across entire project
5. **IDE Support**: Better autocomplete and navigation

## Variable Interpolation

ngx-translate supports variables using `{{variableName}}` syntax.

### Usage in Templates
```html
{{ 'orders.items_count' | translate: { count: cartItems.length } }}
{{ 'orders.welcome_user' | translate: { userName: currentUser.name } }}
```

### Usage in TypeScript
```typescript
this.translateService.get('orders.items_count', { count: this.items.length })
this.translateService.instant('orders.welcome_user', { userName: this.user.name })
```

### Variable Naming
- Use descriptive names: `userName`, `orderCount`, `orderNumber`
- Avoid vague names: `x`, `val`, `count1`

## File Structure

Translation files are located in `apps/medusa-mobile/src/assets/i18n/`:
- `en.json` - English translations
- `pt.json` - Portuguese translations

## Adding New Translations

1. Use lowercase with underscores for all keys
2. Group related keys logically (by page/component/feature)
3. Use descriptive variable names when interpolation is needed
4. Keep keys consistent across both language files

## Examples

### Basic Translation
```json
{
  "home": {
    "title": "Welcome"
  }
}
```

### Translation with Variable
```json
{
  "orders": {
    "items_count": "You have {{count}} items in your cart",
    "welcome": "Welcome, {{userName}}!"
  }
}
```

### Nested Structure
```json
{
  "contact_us": {
    "page": {
      "title": "Contact Us",
      "form": {
        "name": "Name",
        "name_placeholder": "Enter your name"
      }
    }
  }
}
```
