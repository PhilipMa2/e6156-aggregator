// 当文档加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL Parameters:", urlParams.toString()); // 调试信息

    const postId = urlParams.get('postId');
    console.log("Post ID:", postId); // 调试信息

    if (postId) {
        fetchPostDetails(postId);
        fetchComments(postId);
        setupCommentForm(postId);
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

// 设置评论表单
function setupCommentForm(postId) {
    const form = document.getElementById('commentForm');
    form.onsubmit = function(event) {
        event.preventDefault();
        submitComment(postId);
    };
}

// 提交评论
function submitComment(postId) {
    const commentContent = document.getElementById('commentContent').value;
    // 假设以下值是已知的或以某种方式获得的
    const userId = 12345;
    const latitude = 0.0;
    const longitude = 0.0;
    const location = "String";

    fetch(`http://localhost:8000/comments/`, {  // 确保这个 URL 是正确的
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: commentContent,
            post_id: postId,
            user_id: userId,
            latitude: latitude,
            longitude: longitude,
            location: location
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        fetchComments(postId); // 重新加载评论
    })
    .catch(error => console.error('Error posting comment:', error));
}


