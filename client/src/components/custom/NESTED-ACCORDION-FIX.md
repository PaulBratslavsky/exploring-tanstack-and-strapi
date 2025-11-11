# Nested Comment Accordion Fix

## Problem
The original implementation only applied accordion functionality to root-level comments (`depth === 0`). This meant that nested replies with their own children were not displayed properly - they would show as regular comment items without revealing their nested children.

## Root Cause
In `CommentList`, the logic was:
```typescript
// OLD LOGIC - BROKEN
{depth === 0 && comment.replies && comment.replies.length > 0 ? (
  <CommentAccordion /> // Only for root level
) : (
  <CommentItem /> // For all others, but CommentItem doesn't handle nested replies
)}
```

This meant that when a reply had its own children, those children were never displayed because `CommentItem` doesn't render nested replies.

## Solution
Changed the logic to use accordions for ANY comment with replies, regardless of depth:

```typescript
// NEW LOGIC - FIXED
{comment.replies && comment.replies.length > 0 ? (
  <CommentAccordion /> // For ANY comment with replies
) : (
  <CommentItem /> // Only for leaf comments (no children)
)}
```

## Additional Improvements

### Depth-Aware Styling
Updated `CommentAccordion` to adjust its appearance based on depth:

1. **Toggle Button Positioning**: 
   - Root level: `ml-11` (more margin)
   - Nested levels: `ml-8` (less margin)

2. **Icon and Text Sizing**:
   - Root level: `w-4 h-4` icons, normal text
   - Nested levels: `w-3 h-3` icons, smaller text

3. **Reply Count Badge**:
   - Only shown for root level (`depth === 0`)
   - Hidden for nested levels to reduce visual clutter

4. **Collapsed Preview**:
   - Root level: Shows 3 avatars, larger preview
   - Nested levels: Shows 2 avatars, smaller preview

5. **Spacing and Padding**:
   - Root level: `ml-6 pl-6` for replies container
   - Nested levels: `ml-4 pl-4` for tighter spacing

### Visual Hierarchy
- Decorative corner element only shown for root level
- Different spacing classes based on depth
- Smaller collapsed previews for nested levels
- Progressive reduction in visual prominence as depth increases

## Result
Now the comment system properly displays ALL nested levels:
- Root comments with replies → Accordion
- First-level replies with replies → Smaller accordion  
- Second-level replies with replies → Even smaller accordion
- Leaf comments (no replies) → Regular comment items

This creates a fully functional nested comment thread system where users can expand/collapse any level of the conversation hierarchy.

## Testing
Use the `NestedCommentTest` component to verify that:
1. All levels of nesting are displayed
2. Each level has appropriate accordion controls
3. Visual hierarchy is maintained
4. Expand/collapse works at all levels