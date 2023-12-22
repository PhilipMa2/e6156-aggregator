let currentPage = 1;
let postsPerPage = 10; // 默认值
let totalPageCount = 0; // 用于存储总页数

document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const author = document.getElementById('author').value;
    const keyword = document.getElementById('keyword').value;
    const selectedLimit = document.getElementById('limitSelect').value; // 获取用户选择的 limit
    postsPerPage = parseInt(selectedLimit, 10); // 更新每页帖子数量
    fetchPosts(author, keyword, 1, postsPerPage);
});

document.addEventListener('DOMContentLoaded', () => {
    const userPostsButton = document.getElementById('fetchUser12345PostsButton');
    userPostsButton.addEventListener('click', () => fetchUserPostsGraphQL(999));
});


const FETCH_USER_POSTS_QUERY = `
  query FetchUserPosts($userId: Int!) {
    userPosts(userId: $userId) {
      id
      title
      content
    }
  }
`;


function fetchUserPostsGraphQL(userId) {
    const variables = {
        userId: userId
    };

    fetch('http://3.136.22.139:8000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Include any additional headers like authentication tokens here
        },
        body: JSON.stringify({
            query: FETCH_USER_POSTS_QUERY,
            variables: variables
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            return;
        }
        // Process posts to replace user ID 999 with "PROF"
        const processedPosts = data.data.userPosts.map(post => {
            if (post.user_id == 999) {
                return { ...post, user_id: "PROF" }; // Replace user_id with "PROF"
            }
            return post;
        });
        displayPosts(processedPosts); // Adjust based on your actual response structure
    })
    .catch(error => console.error('Error fetching GraphQL data:', error));
}


function fetchPosts(author = '', keyword = '', page = 1, limit = postsPerPage) {
    const baseUrl = 'http://3.136.22.139:8000/posts/'; // 替换为你的 FastAPI 微服务的实际 URL
    const url = `${baseUrl}?skip=${(page - 1) * limit}&limit=${limit}${author ? '&author=' + author : ''}${keyword ? '&keyword=' + keyword : ''}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayPosts(data.posts);
            totalPageCount = data.total_pages; 
            updatePagination(data.total_pages, page);
        })
        .catch(error => console.error('Error:', error));
}

function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    container.innerHTML = ''; // 清空旧帖子

    posts.forEach(post => {
        const userIdDisplay = post.user_id === 999 ? "PROF" : post.user_id;
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.innerHTML = `
            <div class="post-user">User ID: ${userIdDisplay}</div>
            <div class="post-title">${post.title}</div>
            <div class="post-content">${post.content.substring(0, 100)}...</div>
        `;
        postElement.addEventListener('click', () => openPostDetails(post.id));
        container.appendChild(postElement);
    });
}

function updatePagination(totalPages, currentPage) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = `
        <button onclick="previousPage()">Previous</button>
        <span id="currentPage">${currentPage}</span> / <span>${totalPages}</span>
        <button onclick="nextPage()">Next</button>
    `;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage -= 1
        fetchPosts('', '', currentPage, postsPerPage);
    }
}

function nextPage() {
    if (currentPage < totalPageCount) {
        currentPage += 1;
        fetchPosts('', '', currentPage, postsPerPage);
    }
}
function openPostDetails(postId) {
    window.location.href = `postDetails.html?postId=${postId}`;
}

document.getElementById('createPostButton').addEventListener('click', function() {
    document.getElementById('createPostModal').style.display = 'block';
});

function submitNewPost() {
    const title = document.getElementById('newPostTitle').value;
    const content = document.getElementById('newPostContent').value;

    // 这里你需要根据你的 API 调整 post 数据结构
    const postData = {
        title: title,
        content: content,
        user_id: 1 // 假设用户 ID
    };

    fetch('http://3.136.22.139:8000/posts/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Post created:', data);
        closeModal();
        fetchPosts(); // 重新加载帖子
    })
    .catch(error => console.error('Error creating post:', error));
}

function closeModal() {
    document.getElementById('createPostModal').style.display = 'none';
}

// 初始加载帖子
fetchPosts('', '', currentPage, postsPerPage);
