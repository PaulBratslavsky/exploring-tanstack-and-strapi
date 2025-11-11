Build Block Components

## Goal
Create individual React components for each of the 9 block types with proper styling, responsive design, and full TypeScript type safety.

---

## Component Requirements (All Components)

For **EVERY** component you create:

1. **File Location**: Place in `components/blocks/` directory
2. **TypeScript**: Import and use types from `@/types/landing-page`
3. **Exports**: Use named exports (e.g., `export function HeroBlock`)
4. **Responsive**: Mobile-first design (stack on mobile, layout on desktop)
5. **Accessibility**: Semantic HTML, alt text, ARIA labels where needed
6. **Null Safety**: Handle null/undefined values gracefully
7. **Styling**: Use Tailwind CSS classes consistently

---

## Components to Build

### 1. HeroBlock (`components/blocks/HeroBlock.tsx`)

**Purpose:** Large hero section with heading, description, CTA buttons, and image.

**Props:** Use the `HeroBlock` type from your types file

**Design Specifications:**
- **Layout**:
  - Desktop: Two columns (text left, image right) - approximately 60/40 split
  - Mobile: Stack vertically (text on top, image below)
- **Heading**: Very large text (text-4xl or text-5xl), bold, dark color
- **Text**: Medium size (text-lg), lighter color for description
- **Buttons**:
  - Render from `links` array using shadcn/ui Button component
  - PRIMARY type: solid background variant
  - SECONDARY type: outlined variant
  - Display horizontally with spacing
  - Open in new tab if `isExternal` is true (add appropriate target and rel attributes)
- **Image**: Use Next.js `Image` component for optimization, handle null `alternativeText`
- **Container**: Full-width section with centered max-width container
- **Padding**: Generous padding (py-16 or py-20)

---

### 2. SectionHeadingBlock (`components/blocks/SectionHeadingBlock.tsx`)

**Purpose:** Section divider with optional subheading, main heading, and anchor link.

**Props:** Use the `SectionHeadingBlock` type

**Design Specifications:**
- **Layout**: Center-aligned text
- **SubHeading**:
  - Small text (text-sm or text-base)
  - Uppercase
  - Accent color (like blue-600 or your brand color)
  - Display above heading
- **Heading**:
  - Large (text-3xl or text-4xl)
  - Bold
  - Dark color
- **Anchor**: Add `id={anchorLink}` to section element for navigation
- **Spacing**: Generous vertical padding (py-12 or py-16)
- **Container**: Max-width container, centered

---

### 3. CardGridBlock (`components/blocks/CardGridBlock.tsx`)

**Purpose:** Responsive grid of feature cards.

**Props:** Use the `CardGridBlock` type

**Design Specifications:**
- **Layout**:
  - Grid layout
  - Responsive columns: 1 column mobile, 2 tablet, 4 desktop
  - Gap between cards (gap-6 or gap-8)
- **Individual Cards**:
  - Use shadcn/ui Card component or styled div
  - Border and shadow for visual separation
  - Rounded corners
  - Padding inside card
  - Equal height cards (grid handles automatically)
  - **Heading**: Bold, medium size (text-lg or text-xl)
  - **Text**: Smaller, muted color (like text-gray-600)
- **Hover Effect**: Subtle transform/shadow on hover
- **Container**: Max-width container with padding
- **Spacing**: Vertical padding (py-12 or py-16)

**Implementation Notes:**
- Map over the `cards` array
- Use `card.id` as key

---

### 4. ContentWithImageBlock (`components/blocks/ContentWithImageBlock.tsx`)

**Purpose:** Content section with text, optional CTA button, and image that can be on either side.

**Props:** Use the `ContentWithImageBlock` type

**Design Specifications:**
- **Layout**:
  - Desktop: Two columns (50/50 split) using flex or grid
  - Mobile: Stack vertically (image always on top)
  - Use `reversed` prop to swap column order on desktop
  - When reversed is true, image appears on left; when false, image on right
- **Content Side**:
  - **Heading**: Large (text-2xl or text-3xl), bold
  - **Content**: Preserve line breaks in the text
  - **Button**: Only render if `link` is not null
    - Use same button logic as HeroBlock (PRIMARY/SECONDARY variants)
    - Display at bottom of content
- **Image Side**:
  - Use Next.js Image component
  - Full width of column
  - Rounded corners
- **Alignment**: Vertically center text and image
- **Container**: Max-width container with padding
- **Spacing**: Vertical padding (py-12 or py-16)

**Implementation Notes:**
- Conditionally render button only if `link` exists
- Use flexbox with conditional `flex-row-reverse` for column order

---

### 5. MarkdownBlock (`components/blocks/MarkdownBlock.tsx`)

**Purpose:** Render markdown-formatted content.

**Props:** Use the `MarkdownBlock` type

**Design Specifications:**
- **Library**: Use `react-markdown` package to parse and render markdown
- **Container**:
  - Max-width for readability (max-w-3xl or max-w-4xl)
  - Center on page
  - Padding
- **Typography**:
  - Style headings (h2, h3) with appropriate sizes and spacing
  - Style paragraphs with readable line-height
  - Add spacing between elements
  - Use Tailwind Typography plugin `prose` classes if available, otherwise custom styles

**Dependencies:**
- Install: `react-markdown`

---

### 6. PersonCardBlock (`components/blocks/PersonCardBlock.tsx`)

**Purpose:** Testimonial or team member card with quote, name, job title, and photo.

**Props:** Use the `PersonCardBlock` type

**Design Specifications:**
- **Layout**: Card with vertical or horizontal layout (your design choice)
- **Card**:
  - Use shadcn/ui Card or custom styled div
  - Border/shadow for visual prominence
  - Rounded corners
  - Generous padding
  - Background color (white or light gray)
- **Image**:
  - Circular crop (rounded-full)
  - Medium size (w-20 h-20 or w-24 h-24)
  - Positioned at top or left side
- **Quote Text**:
  - Larger text (text-lg)
  - Italic or quote styling
  - Optional: Add quotation marks or quote icon
- **Person Name**:
  - Bold
  - Medium size (text-base or text-lg)
- **Job Title**:
  - Lighter weight
  - Muted color (text-gray-600)
  - Smaller size (text-sm)
- **Alignment**: Center or left-aligned (your choice)
- **Container**: Max-width container, centered
- **Spacing**: Vertical padding (py-12 or py-16)

---

### 7. FaqsBlock (`components/blocks/FaqsBlock.tsx`)

**Purpose:** Frequently Asked Questions with accordion/collapsible pattern.

**Props:** Use the `FaqsBlock` type

**Design Specifications:**
- **Component**: Use shadcn/ui Accordion component
- **Layout**:
  - Each FAQ item as an AccordionItem
  - Question as AccordionTrigger
  - Answer as AccordionContent
- **Behavior**:
  - Click to expand/collapse
  - Smooth animation
  - Single or multiple items open (your choice)
- **Styling**:
  - Question: Bold, clear text
  - Answer: Regular weight, muted color
  - Border between items
  - Appropriate spacing
- **Container**: Max-width container (max-w-3xl), centered
- **Spacing**: Vertical padding (py-12 or py-16)

**Implementation Notes:**
- Map over the `faq` array
- Use `item.id` as key
- Each item needs unique value for accordion

**Dependencies:**
- shadcn/ui Accordion component

---

### 8. FeaturedArticlesBlock (`components/blocks/FeaturedArticlesBlock.tsx`)

**Purpose:** Display featured articles (currently empty, but prepare for future).

**Props:** Use the `FeaturedArticlesBlock` type

**Design Specifications:**
- **Empty State**:
  - Check if `articles.length === 0`
  - Option 1: Return `null` (render nothing)
  - Option 2: Show "No articles yet" message with appropriate styling
- **Future-Ready**:
  - If articles exist in the future, should render as grid of article cards
  - Grid should be: 1 column mobile, 2 tablet, 3 desktop
- **Container**: Max-width container with padding (if rendering anything)

**Implementation:**
Simple component that either returns null or renders an empty state message. Structure should be ready to add article cards in the future.

---

### 9. NewsletterBlock (`components/blocks/NewsletterBlock.tsx`)

**Purpose:** Newsletter email subscription form.

**Props:** Use the `NewsletterBlock` type (omit `formId` if not needed)

**Design Specifications:**
- **Client Component**: Must use `"use client"` directive (forms need interactivity)
- **Layout**:
  - Heading and text at top (centered)
  - Form below with email input and submit button
  - Desktop: Input and button side-by-side
  - Mobile: Stack vertically
- **Components**: Use shadcn/ui Input and Button
- **Input**:
  - Type: `email`
  - Placeholder: Use the `placeholder` prop value
  - Full width on mobile, auto width on desktop
  - Required field
- **Button**:
  - Label: Use the `label` prop value
  - Type: `submit`
  - Primary styling
- **Form Handling**:
  - Add `onSubmit` handler that prevents default
  - Can console.log for now (no actual backend integration needed)
  - Optional: Add basic email format validation
- **Styling**:
  - Background color (light gray or subtle blue tint) to distinguish from other sections
  - Generous padding (py-16 or py-20)
  - Centered content
  - Max-width container
- **Text Formatting**: Preserve line breaks in the text field

**Dependencies:**
- shadcn/ui Input and Button components

---

## Dependencies to Install

Make sure to install:
- `react-markdown` (for MarkdownBlock)
- shadcn/ui components: Button, Input, Card, Accordion

Install shadcn/ui components:
```bash
npx shadcn-ui@latest add button input card accordion
```

Install react-markdown:
```bash
npm install react-markdown
```

---

## Deliverables

After completing Iteration 2, you should have:

1. ✅ **9 Component Files** in `components/blocks/`:
   - `HeroBlock.tsx`
   - `SectionHeadingBlock.tsx`
   - `CardGridBlock.tsx`
   - `ContentWithImageBlock.tsx`
   - `MarkdownBlock.tsx`
   - `PersonCardBlock.tsx`
   - `FaqsBlock.tsx`
   - `FeaturedArticlesBlock.tsx`
   - `NewsletterBlock.tsx`

2. ✅ **All components:**
   - Properly typed with TypeScript
   - Fully responsive (mobile, tablet, desktop)
   - Styled with Tailwind CSS
   - Accessible (semantic HTML, alt text)
   - Handle null/undefined values

3. ✅ **Verified:**
   - TypeScript compiles without errors
   - Components follow consistent design patterns
   - All dependencies installed

---

