// 当文档加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    if (postId) {
        fetchPostDetails(postId);
        fetchComments(postId);
    } else {
        console.error('No post ID provided');
    }
});

// 获取并显示帖子详情
function fetchPostDetails(postId) {
    fetch(`http://localhost:8000/posts/?postID=${postId}`)  // 使用你的 FastAPI 端点
        .then(response => response.json())
        .then(data => {
            if (data.posts && data.posts.length > 0) {
                const post = data.posts[0];
                const postDetailsDiv = document.getElementById('postDetails');
                postDetailsDiv.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <p>Posted by User ID: ${post.user_id}</p>
                    <div>❤️ ${post.likesnum}</div>
                `;
            } else {
                console.error('Post not found');
            }
        })
        .catch(error => console.error('Error fetching post details:', error));
}

// 获取并显示帖子的评论
function fetchComments(postId) {
    fetch(`http://localhost:8000/comments/post/${postId}`)  // 使用你的 FastAPI 端点
        .then(response => response.json())
        .then(comments => {
            const commentsDiv = document.getElementById('comments');
            commentsDiv.innerHTML = '<h3>Comments:</h3>';
            comments.forEach(comment => {
                commentsDiv.innerHTML += `
                    <div>
                        <p>User ID: ${comment.user_id}</p>
                        <p>${comment.content}</p>
                        <div>❤️ ${comment.likesnum}</div>
                    </div>
                `;
            });
        })
        .catch(error => console.error('Error fetching comments:', error));
}
