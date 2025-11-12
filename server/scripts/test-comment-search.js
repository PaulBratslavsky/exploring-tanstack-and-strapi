const qs = require('qs');

const BASE_URL = 'http://localhost:1337';

async function testCommentSearch() {
  console.log('=== Testing Comment Search by Username ===\n');

  // Test 1: Search by username "testuser"
  const query = {
    filters: {
      $or: [
        {
          author: {
            username: {
              $containsi: 'testuser',
            },
          },
        },
        {
          content: {
            $containsi: 'testuser',
          },
        },
      ],
    },
    populate: {
      author: {
        fields: ['username'],
      },
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
    sort: ['createdAt:desc'],
  };

  const queryString = qs.stringify(query, { encodeValuesOnly: true });
  const url = `${BASE_URL}/api/comments/custom/get-comments?${queryString}`;

  console.log('Request URL:');
  console.log(url);
  console.log('\nQuery Object:');
  console.log(JSON.stringify(query, null, 2));
  console.log('\n');

  try {
    const response = await fetch(url);
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('\n=== Response Data ===');
    console.log('Total Comments:', data.data?.length || 0);
    console.log('Pagination:', JSON.stringify(data.meta?.pagination, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== Comments Found ===');
      data.data.forEach((comment, index) => {
        console.log(`\nComment ${index + 1}:`);
        console.log('  ID:', comment.id);
        console.log('  Document ID:', comment.documentId);
        console.log('  Content:', comment.content.substring(0, 50) + '...');
        console.log('  Author:', comment.author?.username || 'N/A');
        console.log('  Created:', comment.createdAt);
      });
    } else {
      console.log('\nNo comments found matching "testuser"');
    }

    // Test 2: Get all comments to see what's available
    console.log('\n\n=== Getting All Comments (for comparison) ===\n');
    const allQuery = {
      populate: {
        author: {
          fields: ['username'],
        },
      },
      pagination: {
        page: 1,
        pageSize: 10,
      },
      sort: ['createdAt:desc'],
    };

    const allQueryString = qs.stringify(allQuery, { encodeValuesOnly: true });
    const allUrl = `${BASE_URL}/api/comments/custom/get-comments?${allQueryString}`;

    const allResponse = await fetch(allUrl);
    const allData = await allResponse.json();

    console.log('Total Comments (all):', allData.data?.length || 0);
    
    if (allData.data && allData.data.length > 0) {
      console.log('\n=== All Comments ===');
      allData.data.forEach((comment, index) => {
        console.log(`\nComment ${index + 1}:`);
        console.log('  Author:', comment.author?.username || 'N/A');
        console.log('  Content:', comment.content.substring(0, 50) + '...');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCommentSearch().catch(console.error);
