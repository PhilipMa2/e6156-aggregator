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

function fetchPosts(author = '', keyword = '', page = 1, limit = postsPerPage) {
    const baseUrl = 'http://localhost:8000/posts/'; // 替换为你的 FastAPI 微服务的实际 URL
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
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.innerHTML = `
            <div class="post-user">User ID: ${post.user_id}</div>
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

// 初始加载帖子
fetchPosts('', '', currentPage, postsPerPage);
