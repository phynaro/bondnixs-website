# Icon Identification Guide

## Overview

The dynamic content system supports two types of icons:

1. **Emoji Icons** - Direct emoji characters (e.g., 🔌, 🚗, 🏥)
2. **SVG Icon Identifiers** - Text identifiers that map to SVG paths (e.g., "lightbulb", "building", "settings")

## How Icons Work

### 1. Emoji Icons
- **Usage**: Enter the emoji character directly in the "Icon" field
- **Examples**: 
  - `🔌` for Electronics
  - `🚗` for Automotive
  - `🏥` for Medical
  - `✈️` for Aerospace
- **Display**: Emojis are rendered directly as text

### 2. SVG Icon Identifiers
- **Usage**: Enter the icon identifier name (without quotes)
- **Available Identifiers**:
  - `lightbulb` - Light bulb icon
  - `building` - Building/company icon
  - `settings` - Settings/gear icon
  - `dollar-sign` - Dollar sign icon
  - `desktop` - Desktop computer icon
  - `check-circle` - Check mark in circle
  - `wrench` - Wrench/tool icon
  - `lightning` - Lightning bolt icon

## How the System Identifies Icons

The rendering logic works as follows:

```javascript
// If icon field contains an emoji (non-ASCII character), display it directly
{benefit.icon ? (
  <div className="text-4xl">{benefit.icon}</div>
) : (
  // Otherwise, use SVG icon identifier
  <svg>
    {getIconSvg(iconName)}
  </svg>
)}
```

## Adding New SVG Icons

To add a new SVG icon identifier:

1. **Find the SVG path** from Heroicons or similar icon library
2. **Add to `getIconSvg` function** in the page component:

```javascript
const getIconSvg = (iconName) => {
  const icons = {
    // ... existing icons
    'new-icon-name': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  }
  return icons[iconName] || null
}
```

3. **Use the identifier** in the admin form (e.g., enter `new-icon-name`)

## Best Practices

- **Use emojis** for simple, colorful icons (industry solutions, categories)
- **Use SVG identifiers** for consistent, styled icons (features, benefits)
- **Keep identifiers lowercase** with hyphens for multi-word names (e.g., `dollar-sign`)
- **Test both types** to ensure they display correctly

## Examples in Database

From the seed data:
- Industry Solutions: `🔌`, `🚗`, `🏥`, `✈️` (emojis)
- Benefits: `lightning`, `check-circle`, `dollar-sign` (SVG identifiers)
- Features: `lightbulb`, `building`, `settings`, `dollar-sign` (SVG identifiers)

