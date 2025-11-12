# Manual Testing Guide for Custom Comment Routes

This guide provides manual test commands for the custom `/api/comments/with-user` endpoints.

## Prerequisites

1. Strapi server running on `http://localhost:1337`
2. At least one comment in the database with author relation
3. (Optional) A registered user account for POST testing

## Test 1: GET /api/comments/with-user (Public Access)

This endpoint should be publicly accessible without authentication.

```bash
curl -X GET "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 200 OK
- Response: Array of comments with author data
- Each comment should have `author` object with only: `id`, `documentId`, `username`

## Test 2: GET with Filters and Pagination

Test filtering by articleId with pagination:

```bash
curl -X GET "http://localhost:1337/api/comments/with-user?filters[articleId][\$eq]=YOUR_ARTICLE_ID&pagination[page]=1&pagination[pageSize]=5&sort[0]=createdAt:desc" \
  -H "Content-Type: application/json"
```

Replace `YOUR_ARTICLE_ID` with an actual article document ID.

**Expected Result:**
- Status: 200 OK
- Response: Filtered and paginated comments
- Maximum 5 comments returned
- Sorted by createdAt descending

## Test 3: POST without Authentication (Should Fail)

This should be rejected:

```bash
curl -X POST "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "content": "This should fail",
      "articleId": "test-article-id"
    }
  }'
```

**Expected Result:**
- Status: 401 Unauthorized or 403 Forbidden
- Error message about authentication required

## Test 4: POST with Authentication

First, get an auth token:

```bash
# Login to get JWT token
curl -X POST "http://localhost:1337/api/auth/local" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-email@example.com",
    "password": "your-password"
  }'
```

Copy the `jwt` from the response, then create a comment:

```bash
curl -X POST "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": {
      "content": "Test comment via custom route",
      "articleId": "test-article-id"
    }
  }'
```

Replace `YOUR_JWT_TOKEN` with the actual token.

**Expected Result:**
- Status: 200 OK
- Response: Created comment with author data
- Author should be set to the authenticated user (not overridable by client)
- Author object should only contain: `id`, `documentId`, `username`

## Test 5: Verify Author Cannot Be Overridden

Try to set a different author (should be ignored):

```bash
curl -X POST "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": {
      "content": "Test author override",
      "articleId": "test-article-id",
      "author": {
        "set": ["fake-user-id-12345"]
      }
    }
  }'
```

**Expected Result:**
- Status: 200 OK
- Author is set to the authenticated user (not the fake ID)
- This verifies server-side security

## Test 6: Validation Tests

### Empty Content (Should Fail)

```bash
curl -X POST "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": {
      "content": "",
      "articleId": "test-article-id"
    }
  }'
```

**Expected Result:**
- Status: 400 Bad Request
- Validation error about empty content

### Missing articleId (Should Fail)

```bash
curl -X POST "http://localhost:1337/api/comments/with-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": {
      "content": "Test content"
    }
  }'
```

**Expected Result:**
- Status: 400 Bad Request
- Validation error about missing articleId

## Verification Checklist

- [ ] GET endpoint is publicly accessible (no auth required)
- [ ] GET returns comments with author username only
- [ ] GET supports filtering by articleId
- [ ] GET supports pagination
- [ ] GET supports sorting
- [ ] POST requires authentication
- [ ] POST creates comment with author set server-side
- [ ] POST ignores client-provided author (security)
- [ ] POST validates required fields
- [ ] Author data only exposes safe fields (id, documentId, username)

## Troubleshooting

### 403 Forbidden on GET endpoint

If you get 403 on the GET endpoint:
1. Verify `auth: false` is set in the route config
2. Restart the Strapi server
3. Check Strapi admin panel → Settings → Roles → Public → Comment permissions

### 401/403 on POST endpoint

This is expected behavior - POST requires authentication.

### Author data includes sensitive fields

Check the controller's sanitization logic in `custom-comment.ts` - it should only return `id`, `documentId`, and `username`.
