# Iteration 3: Build Block Renderer and Integrate

## Goal
Create a dynamic block renderer component that maps API block data to React components, then integrate it into the homepage to render the complete landing page dynamically.

---

## Task 1: Create BlockRenderer Component

**File Location:** `components/BlockRenderer.tsx`

**Purpose:** A component that accepts a single block object and dynamically renders the appropriate block component based on the `__component` field.

### Requirements

Create a component that:
1. **Accepts a block prop** with the `Block` union type from your types
2. **Maps component names to React components** - Use either:
   - Object mapping approach: Create an object where keys are component names (like `"blocks.hero"`) and values are component references
   - Switch statement approach: Use a switch on `block.__component` to return the right component
3. **Handles unknown components** - Return `null` if component doesn't exist (safety check)
4. **Renders the component** - Pass the block data as props to the matched component

### Type Considerations
- Import all 9 block components
- Import the `Block` type from your types file
- TypeScript discriminated unions ensure type safety at the block level
- You may need a type assertion when spreading props (TypeScript limitation with discriminated unions)

---

## Task 2: Update Main Page Component

**File Location:** `app/page.tsx`

**Purpose:** Refactor the homepage to use the BlockRenderer and render all blocks dynamically.

### Requirements

Modify your existing page component to:

1. **Keep the fetch logic** - Don't change how you're fetching data
2. **Remove raw JSON display** - Delete the `<pre>` tag and JSON.stringify code
3. **Import BlockRenderer** - Add import for your new BlockRenderer component
4. **Render blocks dynamically**:
   - Map over the `data.blocks` array
   - For each block, render a `<BlockRenderer>` component
   - Pass the block as a prop
   - Add unique `key` prop using `block.id`
5. **Use semantic HTML** - Wrap everything in a `<main>` element
6. **No container padding** - Remove any container/padding on main (blocks handle their own spacing)
7. **Keep error handling** - Maintain your existing error handling for failed fetches

---

## Task 3: Add Metadata

**File Location:** `app/page.tsx` (add to existing file)

### Requirements

Add Next.js metadata for SEO:

**Option 1: Static metadata**
- Export a `metadata` object with title and description
- Use the `Metadata` type from Next.js
- Add OpenGraph data for social sharing

**Option 2: Dynamic metadata (recommended)**
- Export a `generateMetadata` async function
- Fetch the API data
- Return metadata based on `data.title` and `data.description`
- Handle fetch errors gracefully
- Add OpenGraph fields

---

## Task 4: Optional Enhancements

### A. Loading State

**File:** `app/loading.tsx` (create new file)

Create a loading component that displays while the page is fetching:
- Show a centered loading spinner
- Add a "Loading..." message
- Use appropriate styling to match your design

### B. Error Boundary

**File:** `app/error.tsx` (create new file)

Create an error boundary for runtime errors:
- Must be a Client Component (`"use client"`)
- Accept `error` and `reset` props
- Display error message
- Provide a "Try again" button that calls `reset()`
- Style appropriately

### C. Consistent Spacing

Ensure consistent spacing between blocks. Options:
- Add wrapper div in BlockRenderer with spacing classes
- Ensure each block component has consistent vertical padding

### D. Caching Strategy

Consider caching for production:
- Development: Use `cache: 'no-store'` to always fetch fresh data
- Production options:
  - `cache: 'force-cache'` - Cache indefinitely (ISR)
  - `next: { revalidate: 3600 }` - Revalidate every hour
  - Choose based on how often your Strapi content updates

---

## Verification Checklist

After completing Iteration 3, verify:

### Functionality
- ✅ Page loads without errors
- ✅ All 9 block types render correctly
- ✅ Data is fetched from live API
- ✅ Blocks appear in correct order from API
- ✅ Links work correctly
- ✅ External links open in new tab
- ✅ Newsletter form can be submitted
- ✅ FAQ accordion expands/collapses

### Responsiveness
- ✅ Mobile (375px): All blocks stack vertically correctly
- ✅ Tablet (768px): Two-column layouts work properly
- ✅ Desktop (1280px+): Full layouts with proper spacing

### Accessibility
- ✅ Semantic HTML elements used throughout
- ✅ Images have alt text
- ✅ Links are keyboard accessible (Tab navigation works)
- ✅ Form inputs have proper labels/placeholders
- ✅ Color contrast meets standards
- ✅ Accordion is keyboard accessible

### Code Quality
- ✅ TypeScript compiles without errors
- ✅ No console errors in browser
- ✅ Code is clean and maintainable
- ✅ Components are properly typed
- ✅ Consistent styling patterns

### Performance
- ✅ Images are optimized (using Next.js Image)
- ✅ No unnecessary re-renders
- ✅ Appropriate caching strategy

---

## Testing Guide

### 1. Start Development Server
Run your dev server and navigate to the homepage

### 2. Visual Check
Verify all these blocks render in order:
1. Hero section with buttons and image
2. Section heading with subheading
3. Card grid with 4 cards
4. Content with image (image on right)
5. Content with image (image on left - reversed)
6. Markdown content
7. Person card with photo and quote
8. FAQ accordion
9. Newsletter form

### 3. Interaction Testing
- Click all links (verify external links open in new tab)
- Click FAQ items to expand/collapse
- Try to submit newsletter form
- Test keyboard navigation (Tab through all interactive elements)

### 4. Responsive Testing
Open browser DevTools and test at:
- 375px (mobile)
- 768px (tablet)
- 1280px (desktop)
- Verify layouts change appropriately

### 5. TypeScript Check
Run: `npx tsc --noEmit` to verify no type errors

---

## Deliverables

After completing Iteration 3, you should have:

1. ✅ **`components/BlockRenderer.tsx`**
   - Dynamic block-to-component mapping
   - Type-safe rendering
   - Error handling for unknown blocks

2. ✅ **`app/page.tsx`** (refactored)
   - Data fetching logic
   - Dynamic block rendering using BlockRenderer
   - Error handling
   - Metadata (static or dynamic)

3. ✅ **Optional Files:**
   - `app/loading.tsx` (loading state)
   - `app/error.tsx` (error boundary)

4. ✅ **Complete Landing Page:**
   - Fully functional
   - Renders all 9 block types
   - Responsive across all devices
   - Type-safe with no errors
   - Accessible
   - Production-ready

---

## Success Criteria

Your landing page should now:
- ✅ Fetch and render all blocks from the live Strapi API
- ✅ Display all 9 block types correctly in order
- ✅ Be fully responsive (mobile, tablet, desktop)
- ✅ Have zero TypeScript compilation errors
- ✅ Follow Next.js 15 best practices
- ✅ Be accessible with semantic HTML and keyboard navigation
- ✅ Have clean, maintainable code structure
- ✅ Be ready for production deployment

---

## What You've Built

Congratulations! You now have a complete, production-ready landing page that:
- Dynamically fetches content from a headless CMS (Strapi)
- Renders 9 different block types
- Is fully typed with TypeScript
- Works across all device sizes
- Follows modern React and Next.js patterns
- Can be easily extended with new block types

The page is structured so that content editors can:
- Add, remove, or reorder blocks in Strapi
- Change content without touching code
- Preview changes immediately
