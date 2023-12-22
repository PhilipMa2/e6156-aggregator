let currentEditingPostId = null;
let currentEditingCommentId = null;
const userId = 12345; // 从本地存储获取用户ID
if (userId) {
    fetchUserPosts(userId);
    fetchUserComments(userId);
}

function fetchUserPosts(userId) {
    fetch(`http://3.136.22.139:8000/posts/user/${userId}`)
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('myPosts');
            // 显示每个帖子和操作按钮
            posts.forEach(post => {
                postsContainer.innerHTML += `
                    <div class="post">
                        <h3>${post.title}</h3>
                        <p>Content: ${post.content.substring(0, 100)}</p>
                        <p>User ID: ${post.user_id}</p>
                        <button onclick="deletePost(${post.id})">Delete</button>
                        <button onclick="openEditPostModal(${post.id}, '${post.title}', '${post.content}')">Edit</button>
                    </div>
                `;
            });
        });
}

function fetchUserComments(userId) {
    fetch(`http://3.136.22.139:8000/comments/user/${userId}`)
        .then(response => response.json())
        .then(comments => {
            const commentsContainer = document.getElementById('myComments');
            // 显示每条评论和操作按钮
            comments.forEach(comment => {
                commentsContainer.innerHTML += `
                    <div class="comment">
                        <p>${comment.content.substring(0, 100)}</p>
                        <button onclick="deleteComment(${comment.id})">Delete</button>
                        <button onclick="openEditCommentModal(${comment.id}, '${comment.content}')">Edit</button>
                    </div>
                `;
            });
        });
}

function deletePost(postId) {
    if (userId) {
        fetch(`http://3.136.22.139:8000/posts/${postId}?user_id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if(response.ok) {
                alert('Post deleted successfully');
                window.location.reload(); // 刷新页面显示最新数据
            } else {
                alert('Failed to delete post');
            }
        });
    }
}

// 类似地，你可以添加 deleteComment 函数来处理评论的删除
function deleteComment(commentId) {
    if (userId) {
        fetch(`http://3.136.22.139:8000/comments/${commentId}?user_id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if(response.ok) {
                alert('Comment deleted successfully');
                window.location.reload(); // 刷新页面显示最新数据
            } else {
                alert('Failed to delete comment');
            }
        });
    }
}
function openEditPostModal(postId, title, content) {
    // 设置当前正在编辑的帖子ID
    currentEditingPostId = postId;

    // 填充弹窗表单的当前值
    document.getElementById('editPostTitle').value = title;
    document.getElementById('editPostContent').value = content;

    // 显示弹窗
    document.getElementById('editPostModal').style.display = 'block';
}

function openEditCommentModal(commentId, content) {
    // 设置当前正在编辑的评论ID
    currentEditingCommentId = commentId;

    // 填充弹窗表单的当前值
    document.getElementById('editCommentContent').value = content;

    // 显示弹窗
    document.getElementById('editCommentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function updatePost(postId) {
    const title = document.getElementById('editPostTitle').value;
    const content = document.getElementById('editPostContent').value;

    fetch(`http://3.136.22.139:8000/posts/${postId}?user_id=${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title, content: content, user_id: userId })
    })
    .then(response => {
        if(response.ok) {
            alert('Post updated successfully');
            window.location.reload();
        } else {
            alert('Failed to update post');
        }
    });
}

function updateComment(commentId) {
    const content = document.getElementById('editCommentContent').value;

    fetch(`http://3.136.22.139:8000/comments/${commentId}?user_id=${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content,post_id: 0, user_id: userId })
    })
    .then(response => {
        if(response.ok) {
            alert('Comment updated successfully');
            window.location.reload();
        } else {
            alert('Failed to update comment');
        }
    });
}