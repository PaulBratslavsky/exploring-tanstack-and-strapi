# Landing Page Development Prompt

## Your Role
You are a senior frontend developer experienced with TypeScript, React, Next.js 15, Tailwind CSS 4, and building dynamic content-driven websites with Strapi as the headless CMS backend.

## Task
Build a complete, production-ready landing page in TypeScript that fetches and renders dynamic content from a Strapi API endpoint. The page consists of multiple reusable block components that are rendered based on the API response data.

## API Information
**Endpoint:** `https://credible-miracle-2b04612d98.strapiapp.com/api/landing-page`
**Method:** GET
**Response Format:** JSON

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS 4** (for styling)
- **shadcn/ui** (for UI components like buttons, cards, etc.)

---

## Block Components Specifications

The API returns a `blocks` array containing different component types identified by the `__component` field. You must create a dedicated React component for each block type with the following specifications:

### 1. **blocks.hero**
A hero section with heading, text, call-to-action links, and an image.

**Fields:**
- `heading` (string): Main hero headline
- `text` (string): Supporting description text
- `links` (array): Call-to-action buttons with properties:
  - `href` (string): Link URL
  - `label` (string): Button text
  - `isExternal` (boolean): Opens in new tab if true
  - `isButtonLink` (boolean): Styled as button vs text link
  - `type` (enum): "PRIMARY" or "SECONDARY" for styling variants
- `image` (object): Hero image with properties:
  - `url` (string): Image URL
  - `alternativeText` (string | null): Alt text for accessibility

**Design Requirements:**
- Full-width hero section with large, prominent heading
- Display image prominently (right side on desktop, full-width on mobile)
- Buttons should be horizontally aligned with proper spacing
- PRIMARY buttons should have solid background, SECONDARY should be outlined
- Mobile responsive: stack content vertically on smaller screens

---

### 2. **blocks.section-heading**
A section divider with optional subheading, main heading, and anchor link for navigation.

**Fields:**
- `subHeading` (string): Small text above main heading
- `heading` (string): Main section heading
- `anchorLink` (string): ID for anchor navigation

**Design Requirements:**
- Center-aligned text
- SubHeading should be smaller, possibly with accent color
- Main heading should be large and bold
- Add appropriate spacing above and below for visual separation
- Include id attribute for scroll navigation

---

### 3. **blocks.card-grid**
A grid layout of cards with heading and description text.

**Fields:**
- `cards` (array): Array of card objects with:
  - `heading` (string): Card title
  - `text` (string): Card description

**Design Requirements:**
- Responsive grid: 4 columns on large screens, 2 on tablet, 1 on mobile
- Cards should have consistent height
- Each card should have subtle border/shadow for visual separation
- Appropriate padding and spacing between cards
- Hover effects for interactivity

---

### 4. **blocks.content-with-image**
A content section with text, optional link, and an image that can be positioned on either side.

**Fields:**
- `heading` (string): Section heading
- `content` (string): Body text (may contain line breaks)
- `reversed` (boolean): If true, image on left; if false, image on right
- `link` (object | null): Optional CTA button with same structure as hero links
- `image` (object): Section image

**Design Requirements:**
- Two-column layout on desktop (50/50 split)
- Reverse column order based on `reversed` flag
- Stack vertically on mobile (image always on top)
- Preserve line breaks in content text
- If link exists, display as button at bottom of text content
- Vertical center alignment of text and image

---

### 5. **blocks.markdown**
Renders markdown-formatted content.

**Fields:**
- `content` (string): Markdown-formatted text

**Design Requirements:**
- Parse and render markdown to HTML (headings, paragraphs, lists, links, etc.)
- Use a markdown parser library (e.g., `react-markdown`)
- Apply proper typography styles (matching site design)
- Ensure proper spacing between markdown elements
- Container should have max-width for readability

---

### 6. **blocks.person-card**
A testimonial or team member card with quote, name, job title, and image.

**Fields:**
- `text` (string): Quote or description
- `personName` (string): Person's name
- `personJob` (string): Job title/role
- `image` (object): Person's photo

**Design Requirements:**
- Card layout with photo, quote text, name, and job title
- Photo should be circular or rounded
- Quote text should have quote styling (quotation marks or distinct typography)
- Name in bold, job title in lighter weight below
- Center-aligned or left-aligned layout (your choice for best aesthetics)
- Card should stand out visually (border, shadow, or background)

---

### 7. **blocks.faqs**
Frequently Asked Questions accordion section.

**Fields:**
- `faq` (array): Array of FAQ items with:
  - `heading` (string): Question
  - `text` (string): Answer

**Design Requirements:**
- Use accordion/collapsible UI pattern (shadcn/ui Accordion component recommended)
- Questions should be clickable to expand/collapse answers
- Only one answer open at a time (or multiple, your choice)
- Clear visual distinction between question and answer
- Smooth expand/collapse animations
- Appropriate spacing between FAQ items

---

### 8. **blocks.featured-articles**
A section to display featured article cards (data may be empty).

**Fields:**
- `articles` (array): Array of article objects (currently empty in example)

**Design Requirements:**
- If array is empty, either render nothing or show "No articles yet" message
- If articles exist (for future), render as a grid of article cards
- Design for scalability even if current data is empty

---

### 9. **blocks.newsletter**
Newsletter subscription form.

**Fields:**
- `heading` (string): Form heading
- `text` (string): Supporting description
- `placeholder` (string): Input placeholder text
- `label` (string): Submit button text
- `formId` (string | null): Optional form identifier

**Design Requirements:**
- Email input field with placeholder
- Submit button with label text
- Heading and descriptive text above form
- Horizontal layout on desktop (input + button side-by-side)
- Stack vertically on mobile
- Form validation (basic email format check)
- Use shadcn/ui Input and Button components

---

## Implementation Requirements

### Architecture
1. **Main Page Component** (`app/page.tsx`):
   - Fetch data from API endpoint using native `fetch` in an async Server Component
   - Handle loading and error states appropriately
   - Map over `blocks` array and render appropriate component for each block

2. **Component Mapping**:
   - Create a mapping object or switch statement to match `__component` values to React components
   - Example structure:
   ```typescript
   const blockComponents = {
     'blocks.hero': HeroBlock,
     'blocks.section-heading': SectionHeadingBlock,
     // ... etc
   }
   ```

3. **Type Safety**:
   - Create comprehensive TypeScript interfaces/types for:
     - API response structure
     - Each block's data shape
     - Shared types (Link, Image, etc.)
   - Use discriminated unions for the blocks array type

4. **File Structure**:
   ```
   app/
     page.tsx              # Main landing page (fetch + render)
   components/
     blocks/
       HeroBlock.tsx
       SectionHeadingBlock.tsx
       CardGridBlock.tsx
       ContentWithImageBlock.tsx
       MarkdownBlock.tsx
       PersonCardBlock.tsx
       FaqsBlock.tsx
       FeaturedArticlesBlock.tsx
       NewsletterBlock.tsx
   types/
     landing-page.ts       # All TypeScript types/interfaces
   ```

5. **Styling**:
   - Use Tailwind CSS 4 utility classes
   - Ensure mobile-first responsive design
   - Use shadcn/ui components where appropriate (Button, Card, Input, Accordion, etc.)
   - Maintain consistent spacing, typography, and color scheme across all blocks

6. **Best Practices**:
   - Use Next.js 15 App Router conventions (Server Components by default)
   - Extract reusable components where applicable
   - Handle null/undefined values safely
   - Add proper alt text for images for accessibility
   - Use semantic HTML elements
   - Ensure proper TypeScript strict mode compliance

---

## API Response Data

```json
{
  "data": {
    "id": 2,
    "documentId": "cehs2lhab5py2pgvnmsky85o",
    "title": "Landing Page",
    "description": "This is the main website page.",
    "createdAt": "2025-03-23T04:02:01.879Z",
    "updatedAt": "2025-08-03T01:07:23.472Z",
    "publishedAt": "2025-08-03T01:07:23.487Z",
    "blocks": [
      {
        "__component": "blocks.hero",
        "id": 2,
        "heading": "Build & Launch without problems",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque efficitur nisl sodales egestas lobortis.",
        "links": [
          {
            "id": 21,
            "href": "https://strapi.io",
            "label": "Get Started",
            "isExternal": true,
            "isButtonLink": true,
            "type": "PRIMARY"
          },
          {
            "id": 22,
            "href": "https://docs.strapi.io",
            "label": "How It Works",
            "isExternal": true,
            "isButtonLink": true,
            "type": "SECONDARY"
          }
        ],
        "image": {
          "id": 6,
          "documentId": "pxuhf5ukwzafkmb8ue8biagy",
          "alternativeText": null,
          "url": "https://credible-miracle-2b04612d98.media.strapiapp.com/tables_921e2e7dac.avif"
        }
      },
      {
        "__component": "blocks.section-heading",
        "id": 2,
        "subHeading": "Dolor sit amet consectutar",
        "heading": "Build & Launch without problems",
        "anchorLink": "section-1"
      },
      {
        "__component": "blocks.card-grid",
        "id": 2,
        "cards": [
          {
            "id": 7,
            "heading": "Lorem ipsum dolor sit amet consectutar",
            "text": "Fusce quam tellus, placerat eu metus ut, viverra aliquet purus. Suspendisse potenti. Nulla non nibh feugiat."
          },
          {
            "id": 8,
            "heading": "Ut congue nec leo eget aliquam",
            "text": "Ut tempus tellus ac nisi vestibulum tempus. Nunc tincidunt lectus libero, ac ultricies augue elementum at."
          },
          {
            "id": 9,
            "heading": "Proin fringilla eleifend justo pellentesque",
            "text": "Donec ut ligula nunc. Mauris blandit vel est et facilisis. Integer sapien felis, aliquet at posuere et, porttitor quis ligula."
          },
          {
            "id": 10,
            "heading": "Morbi sagittis ligula sit amet elit maximus",
            "text": "Duis ut facilisis orci. Morbi lacinia nunc a augue eleifend, sed placerat ex faucibus. Duis ante arcu, pretium ac luctus vulputate."
          }
        ]
      },
      {
        "__component": "blocks.content-with-image",
        "id": 3,
        "reversed": false,
        "heading": "Morbi scelerisque nulla et lectus dignissim eleifend nulla eu nulla a metus",
        "content": "Quisque id sagittis turpis. Nulla sollicitudin rutrum eros eu dictum. Integer sit amet erat sit amet lectus lacinia mattis. Donec est tortor, fermentum at urna a, accumsan suscipit sem.\n\n",
        "link": null,
        "image": {
          "id": 7,
          "documentId": "m6k376b2oa58vg2dnu5lsv0i",
          "alternativeText": null,
          "url": "https://credible-miracle-2b04612d98.media.strapiapp.com/forest_562bafce29.avif"
        }
      },
      {
        "__component": "blocks.content-with-image",
        "id": 4,
        "reversed": true,
        "heading": "Morbi scelerisque nulla et lectus dignissim eleifend nulla eu nulla a metus",
        "content": "Quisque id sagittis turpis. Nulla sollicitudin rutrum eros eu dictum. Integer sit amet erat sit amet lectus lacinia mattis. Donec est tortor, fermentum at urna a, accumsan suscipit sem.",
        "link": {
          "id": 20,
          "href": "https://strapi.io",
          "label": "Try Strapi",
          "isExternal": true,
          "isButtonLink": true,
          "type": "PRIMARY"
        },
        "image": {
          "id": 7,
          "documentId": "m6k376b2oa58vg2dnu5lsv0i",
          "alternativeText": null,
          "url": "https://credible-miracle-2b04612d98.media.strapiapp.com/forest_562bafce29.avif"
        }
      },
      {
        "__component": "blocks.markdown",
        "id": 2,
        "content": "## Introduction\nFreelancing as a developer is an exciting path that offers independence and financial growth. However, getting started can feel overwhelming without proper guidance. By focusing on key areas like skill development, networking, and client acquisition, you can establish a successful freelancing career.\n\n## Building a Strong Portfolio\nYour portfolio is your strongest asset as a freelancer. Instead of listing skills, showcase projects that demonstrate your capabilities. Consider building personal projects, contributing to open source, or offering pro bono work to gain experience. A well-presented portfolio builds trust with potential clients."
      },
      {
        "__component": "blocks.person-card",
        "id": 2,
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque et placerat metus. Morbi aliquet felis sit amet erat finibus, ac condimentum ligula ornare.",
        "personName": "Alice Bradley",
        "personJob": "Backend Developer",
        "image": {
          "id": 8,
          "documentId": "uka7pcf3dw7yczakvaj6dv3o",
          "alternativeText": null,
          "url": "https://credible-miracle-2b04612d98.media.strapiapp.com/image_of_women_fa698d5653.avif"
        }
      },
      {
        "__component": "blocks.faqs",
        "id": 2,
        "faq": [
          {
            "id": 11,
            "heading": "How many cats does Paul have?",
            "text": "He has two cats."
          },
          {
            "id": 12,
            "heading": "What are their names?",
            "text": "Olive and Gracie."
          }
        ]
      },
      {
        "__component": "blocks.featured-articles",
        "id": 2,
        "articles": []
      },
      {
        "__component": "blocks.newsletter",
        "id": 2,
        "heading": "Stay updated with our team",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n",
        "placeholder": "example@email.com",
        "label": "Submit",
        "formId": null
      }
    ]
  },
  "meta": {}
}
```

---

## Deliverables

Provide a complete, working implementation including:

1. **Type definitions** (`types/landing-page.ts`):
   - Interface for complete API response
   - Individual types for each block component
   - Shared types (Link, Image, etc.)
   - Discriminated union type for all block types

2. **Block components** (`components/blocks/*.tsx`):
   - One component file for each of the 9 block types
   - Properly typed props
   - Responsive, accessible, and polished UI
   - Use shadcn/ui components where applicable

3. **Main page** (`app/page.tsx`):
   - Fetch data from live API endpoint
   - Component mapping logic
   - Error handling
   - Proper TypeScript typing

4. **Additional considerations**:
   - Ensure all external links open in new tabs when `isExternal` is true
   - Handle optional/nullable fields gracefully
   - Use Next.js Image component for optimized images where appropriate
   - Add loading states if needed

---

## Success Criteria

- Page renders all 9 block types correctly
- Fully responsive across mobile, tablet, and desktop
- Type-safe with no TypeScript errors
- Clean, maintainable code structure
- Follows Next.js 15 and React best practices
- Accessible (semantic HTML, alt text, keyboard navigation)
- Visually polished with consistent design language
