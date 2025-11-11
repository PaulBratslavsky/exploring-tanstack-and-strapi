Fetch Data and Display Raw Output

## Your Role
You are a senior frontend developer experienced with TypeScript, React, Next.js 15, Tailwind CSS 4, and building dynamic content-driven websites with Strapi as the headless CMS backend.

## Goal
Set up the basic data fetching infrastructure, create comprehensive TypeScript types for the API response, and display the raw API response to verify connectivity and data structure.

## API Information
**Endpoint:** `https://credible-miracle-2b04612d98.strapiapp.com/api/landing-page`
**Method:** GET
**Response Format:** JSON

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS 4** (for styling)

---

## Task 1: Create Type Definitions

**File Location:** `types/landing-page.ts`

### Requirements

You need to create comprehensive TypeScript types that model the entire API response structure. Use the API response data provided at the bottom of this document as your reference.

#### Shared Types to Create

Define reusable types that appear across multiple blocks:

1. **Image Type**
   - Contains: id, documentId, alternativeText (nullable), url

2. **Link Type**
   - Contains: id, href, label, isExternal, isButtonLink, type (literal union: "PRIMARY" or "SECONDARY")

3. **Card Type**
   - Contains: id, heading, text

4. **FAQ Type**
   - Contains: id, heading, text

#### Block Types to Create

Create individual TypeScript interfaces for each of the 9 block types. Each block interface must:
- Have a `__component` field as a string literal type (for discriminated unions)
- Have an `id` field (number)
- Include all the specific fields for that block type

**The 9 block types you need to model:**

1. **HeroBlock** - Component name: `"blocks.hero"`
   - Fields: heading, text, links array, image

2. **SectionHeadingBlock** - Component name: `"blocks.section-heading"`
   - Fields: subHeading, heading, anchorLink

3. **CardGridBlock** - Component name: `"blocks.card-grid"`
   - Fields: cards array

4. **ContentWithImageBlock** - Component name: `"blocks.content-with-image"`
   - Fields: heading, content, reversed (boolean), link (nullable), image

5. **MarkdownBlock** - Component name: `"blocks.markdown"`
   - Fields: content

6. **PersonCardBlock** - Component name: `"blocks.person-card"`
   - Fields: text, personName, personJob, image

7. **FaqsBlock** - Component name: `"blocks.faqs"`
   - Fields: faq array

8. **FeaturedArticlesBlock** - Component name: `"blocks.featured-articles"`
   - Fields: articles array (can be empty array)

9. **NewsletterBlock** - Component name: `"blocks.newsletter"`
   - Fields: heading, text, placeholder, label, formId (nullable)

#### Union and Response Types

Create:
1. A **discriminated union type** called `Block` that combines all 9 block types
2. A **LandingPageData interface** that models the `data` object containing: id, documentId, title, description, createdAt, updatedAt, publishedAt, blocks array
3. A **LandingPageResponse interface** for the top-level response with `data` and `meta` properties

**Important:** Use discriminated unions with the `__component` field to ensure type safety when rendering different block types.

---

## Task 2: Create Main Page Component

**File Location:** `app/page.tsx`

### Requirements

Create the main landing page as an async Server Component that:

1. **Fetches data** from the Strapi API endpoint using native `fetch`
   - Use the full URL provided above
   - Disable caching for development (`cache: 'no-store'`)

2. **Handles errors gracefully**
   - Check if the response is ok before parsing JSON
   - If fetch fails, display an error message to the user with the status code
   - Style the error state appropriately

3. **Types the response**
   - Import and use your `LandingPageResponse` type
   - Ensure full type safety

4. **Displays the raw JSON**
   - Use a `<pre>` tag to display formatted JSON
   - Use `JSON.stringify()` with proper indentation (2 spaces)
   - Make the output scrollable and readable

5. **Styling requirements**
   - Add a page heading like "Landing Page Data (Raw JSON)"
   - Use a container with max-width and centered layout
   - Style the JSON output with:
     - Light gray or dark background for contrast
     - Border and rounded corners
     - Adequate padding
     - Monospace font
     - Horizontal and vertical scrolling if content overflows
   - Ensure readability in both light and dark modes

---

## Verification

After completing this iteration, you should be able to:

✅ Start your development server and navigate to the homepage
✅ See a clear page title
✅ See the full API response displayed as nicely formatted JSON
✅ Scroll through the JSON to view all blocks
✅ Verify all data is being fetched correctly from the API
✅ Have zero TypeScript compilation errors
✅ See type hints and autocomplete working in your IDE for the API response

---

## API Response Reference

Use this complete API response to create your TypeScript types:

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

1. ✅ **`types/landing-page.ts`** - Complete TypeScript type definitions
   - All shared types (Image, Link, Card, FAQ)
   - All 9 block type interfaces with proper discriminated unions
   - Union type for all blocks
   - API response type definitions

2. ✅ **`app/page.tsx`** - Homepage with data fetching
   - Async Server Component
   - Fetch from live API with error handling
   - Raw JSON display with proper styling
   - Full type safety

3. ✅ **Verification**
   - TypeScript compiles without errors
   - Page loads successfully
   - JSON output is readable and scrollable
   - All data correctly fetched from API

