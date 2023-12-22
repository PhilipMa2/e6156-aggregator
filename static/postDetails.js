document.addEventListener('DOMContentLoaded', function() {
    const pathArray = window.location.pathname.split('/');
    const postId = pathArray[pathArray.length - 1]; // 假设postId是路径的最后一部分

    console.log("Post ID:", postId); // 调试信息

    if (postId) {
        fetchPostDetails(postId);
        fetchComments(postId);
        setupCommentForm(postId);
    } else {
        console.error('No post ID provided');
    }
});


function fetchPostDetails(postId) {
    fetch(`http://3.136.22.139:8000/posts/${postId}`)  // 使用你的 FastAPI 端点
        .then(response => response.json())
        .then(data => {
            console.log("Received data:", data);  // 打印查看接收到的数据

            // 直接检查data对象是否有内容，而不是data.posts
            if (data && data.id) {  // 假设每个帖子都有唯一的ID
                const postDetailsDiv = document.getElementById('postDetails');
                postDetailsDiv.innerHTML = `
                    <h2>${data.title}</h2>
                    <p>${data.content}</p>
                    <p>Posted by User ID: ${data.user_id}</p>
                    <div>❤️ ${data.likesnum}</div>
                `;
            } else {
                console.error('Post not found');
                // 可以在页面上显示错误信息
                const postDetailsDiv = document.getElementById('postDetails');
                postDetailsDiv.innerHTML = `<p>Post not found.</p>`;
            }
        })
        .catch(error => console.error('Error fetching post details:', error));
}


function fetchComments(postId) {
    fetch(`http://3.136.22.139:8000/comments/post/${postId}`)  // 使用你的 FastAPI 端点
        .then(response => response.json())
        .then(comments => {
            const commentsDiv = document.getElementById('comments');
            commentsDiv.innerHTML = '<h3>Comments:</h3>';
            comments.forEach(comment => {
                commentsDiv.innerHTML += `
                    <div>
                        <p>User ID: ${comment.user_id}</p>
                        <p>${comment.content}</p>
                        <div class="like-button" data-comment-id="${comment.id}" data-likes="${comment.likesnum}">❤️ ${comment.likesnum}</div>
                    </div>
                `;
            });
            attachLikeEventListeners(); // 为爱心图标添加点击事件
        })
        .catch(error => console.error('Error fetching comments:', error));
}

// 为每个爱心图标添加点击事件
function attachLikeEventListeners() {
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('liked')) { // 如果还没有点赞
                const commentId = this.getAttribute('data-comment-id');
                const currentLikes = parseInt(this.getAttribute('data-likes'), 10);
                updateCommentLikes(commentId, currentLikes + 1);
                //print(commentId,currentLikes)
                this.classList.add('liked'); // 标记为已点赞
            }
        });
    });
}

// 更新评论的点赞数
function updateCommentLikes(commentId, newLikes) {
    fetch(`http://3.136.22.139:8000/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({likesnum: newLikes})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Comment updated:', data);
        const likeButton = document.querySelector(`.like-button[data-comment-id="${commentId}"]`);
        likeButton.innerHTML = `❤️ ${data.likesnum}`; // 更新为最新的点赞数
        likeButton.setAttribute('data-likes', data.likesnum);
    })
    .catch(error => console.error('Error updating comment:', error));
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

    fetch(`http://3.136.22.139:8000/comments/`, {  // 确保这个 URL 是正确的
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
