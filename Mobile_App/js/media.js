/* ==============================================================================
   MEDIA & SOCIAL STREAMING MODULE CONTROLLER
   Video Reels, Mutual Follow Requests, Role Gating, Comments, & Uploads
   ============================================================================== */

class MediaModule {
  constructor() {
    this.posts = [];
    this.filterTab = "all";
  }

  init() {
    this.posts = window.MockStore.getMediaPosts();
    this.renderFeed();
    this.setupListeners();
  }

  setupListeners() {
    // Media feed tabs (Trending Reels, Action Photos, Mutual Athletes, Following)
    document.querySelectorAll(".media-tab-btn").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        document.querySelectorAll(".media-tab-btn").forEach((b) => b.classList.remove("active"));
        tabBtn.classList.add("active");
        this.filterTab = tabBtn.dataset.tab;
        this.renderFeed();
      });
    });

    // Upload Media Button
    const uploadBtn = document.getElementById("open-media-upload-btn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        if (!this.checkAuth("upload video or photos")) return;
        window.openModal("media-upload-modal");
      });
    }

    // Media Upload Form
    const uploadForm = document.getElementById("media-upload-form");
    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleUploadMedia(new FormData(uploadForm));
      });
    }

    // Listen for state changes (role changes, likes, follows)
    window.AppState.subscribe((event) => {
      if (event === "roleChanged" || event === "likeChanged" || event === "followChanged") {
        this.renderFeed();
      }
    });
  }

  checkAuth(actionDescription) {
    const user = window.AppState.currentUser;
    if (!user || !user.isRegistered) {
      // Trigger Gatekeeper Modal
      const promptEl = document.getElementById("gatekeeper-action-prompt");
      if (promptEl) {
        promptEl.innerText = `To ${actionDescription}, please register for a free account or switch to a demo role.`;
      }
      window.openModal("media-gatekeeper-modal");
      return false;
    }
    return true;
  }

  handleUploadMedia(formData) {
    const user = window.AppState.currentUser;
    const newPost = {
      id: `post-${Date.now()}`,
      authorId: user.handle || "user-self",
      authorName: user.name,
      authorHandle: user.handle,
      authorRole: user.title,
      authorAvatar: user.avatar,
      title: formData.get("title") || "Community Sports Highlight",
      caption: formData.get("caption") || "Just uploaded from my sports journey!",
      hashtags: formData.get("hashtags") || "#Sports #Fitness #Kalawar",
      mediaType: formData.get("mediaType") || "video",
      mediaUrl: formData.get("mediaUrl") || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80",
      duration: formData.get("mediaType") === "video" ? "0:42" : null,
      likesCount: 1,
      commentsCount: 0,
      viewsCount: 12,
      timestamp: "Just now",
      comments: []
    };

    this.posts.unshift(newPost);
    window.MockStore.saveMediaPosts(this.posts);

    // Auto-like our own post
    window.AppState.likedPosts.add(newPost.id);

    window.closeModal("media-upload-modal");
    this.renderFeed();
    window.showToast("Your media has been published to the community feed!", "success");
    document.getElementById("media-upload-form").reset();
  }

  renderFeed() {
    const feedContainer = document.getElementById("media-feed-posts");
    if (!feedContainer) return;

    let displayPosts = [...this.posts];

    if (this.filterTab === "videos") {
      displayPosts = displayPosts.filter((p) => p.mediaType === "video");
    } else if (this.filterTab === "photos") {
      displayPosts = displayPosts.filter((p) => p.mediaType === "photo");
    } else if (this.filterTab === "mutual") {
      displayPosts = displayPosts.filter((p) => window.AppState.getFollowStatus(p.authorId) === "mutual");
    }

    if (displayPosts.length === 0) {
      feedContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📱</div>
          <h3 style="font-size: 1.3rem; color: var(--text-secondary); margin-bottom: 8px;">No media found in this tab</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Be the first athlete to upload or follow creators to populate your mutual feed!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = displayPosts.map((post) => this.renderPostCard(post)).join("");
  }

  renderPostCard(post) {
    const isLiked = window.AppState.isLiked(post.id);
    const isSubscribed = window.AppState.isSubscribed(post.authorId);
    const followStatus = window.AppState.getFollowStatus(post.authorId);

    let followBtnHtml = "";
    if (followStatus === "mutual") {
      followBtnHtml = `<button class="follow-btn mutual" onclick="window.handleFollowClick('${post.authorId}', '${post.authorName}')">✓ Mutual Followers</button>`;
    } else if (followStatus === "requested") {
      followBtnHtml = `<button class="follow-btn requested" onclick="window.handleFollowClick('${post.authorId}', '${post.authorName}')">⏳ Requested</button>`;
    } else {
      followBtnHtml = `<button class="follow-btn not-following" onclick="window.handleFollowClick('${post.authorId}', '${post.authorName}')">+ Follow Request</button>`;
    }

    const effectiveLikes = post.likesCount + (isLiked ? 1 : 0);

    return `
      <div class="social-post-card" id="card-${post.id}">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-creator-info">
            <img src="${post.authorAvatar}" alt="${post.authorName}" class="post-creator-avatar" />
            <div class="post-creator-meta">
              <h4>${post.authorName} <span class="badge badge-gold" style="font-size:0.65rem; padding:1px 6px;">${post.authorRole}</span></h4>
              <p>${post.authorHandle} • ${post.timestamp}</p>
            </div>
          </div>
          <div>
            ${followBtnHtml}
          </div>
        </div>

        <!-- Post Media Player Simulation -->
        <div class="post-media-container">
          <img src="${post.mediaUrl}" alt="${post.title}" class="post-media-element" id="media-elem-${post.id}" />
          ${
            post.mediaType === "video"
              ? `
              <div class="video-sim-overlay" onclick="window.simulatePlayVideo('${post.id}')" id="overlay-${post.id}">
                <button class="play-pause-btn" aria-label="Play Video">▶</button>
              </div>
              <span class="video-live-pill">⚡ Reel</span>
              <span class="video-duration-pill">${post.duration || "0:30"}</span>
            `
              : `<span class="video-live-pill" style="background:var(--gold-primary); color:#000;">📷 Photo</span>`
          }
        </div>

        <!-- Post Actions -->
        <div class="post-actions-bar">
          <div class="post-action-group">
            <div class="action-trigger ${isLiked ? 'liked' : ''}" onclick="window.handleLikeClick('${post.id}')">
              <span class="like-icon" style="font-size:1.4rem;">${isLiked ? '❤️' : '🤍'}</span>
              <span>${effectiveLikes.toLocaleString()}</span>
            </div>
            <div class="action-trigger" onclick="window.toggleComments('${post.id}')">
              <span style="font-size:1.3rem;">💬</span>
              <span>${post.comments.length}</span>
            </div>
            <div class="action-trigger" onclick="window.showToast('Post link copied to clipboard!', 'info')">
              <span style="font-size:1.3rem;">🔗</span>
              <span>Share</span>
            </div>
          </div>
          <button class="subscribe-channel-btn ${isSubscribed ? 'subscribed' : ''}" onclick="window.handleSubscribeClick('${post.authorId}', '${post.authorName}')">
            <span>${isSubscribed ? '🔔 Subscribed' : '🔔 Subscribe'}</span>
          </button>
        </div>

        <!-- Caption Box -->
        <div class="post-caption-box">
          <h4 style="font-size:1.1rem; color:#fff; margin-bottom:4px;">${post.title}</h4>
          <p class="caption-text">${post.caption}</p>
          <div class="caption-hashtags">${post.hashtags}</div>
        </div>

        <!-- Comments Thread Section -->
        <div class="comments-section" id="comments-section-${post.id}">
          <div class="comments-list" id="comments-list-${post.id}">
            ${post.comments
              .map(
                (c) => `
              <div class="comment-row">
                <span class="comment-author-name">${c.author}:</span>
                <span class="comment-text">${c.text}</span>
              </div>
            `
              )
              .join("")}
          </div>
          <form class="add-comment-form" onsubmit="window.handleAddComment(event, '${post.id}')">
            <input type="text" class="comment-input" placeholder="Write a comment as ${window.AppState.currentUser.name}..." id="comment-input-${post.id}" />
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
          </form>
        </div>
      </div>
    `;
  }
}

window.MediaModuleInstance = new MediaModule();
window.addEventListener("DOMContentLoaded", () => {
  window.MediaModuleInstance.init();
});

// Global Handlers
window.handleLikeClick = function(postId) {
  if (!window.MediaModuleInstance.checkAuth("like this video")) return;
  const liked = window.AppState.toggleLike(postId);
  window.showToast(liked ? "Liked post! ❤️" : "Unliked post", "info");
};

window.handleFollowClick = function(targetId, targetName) {
  if (!window.MediaModuleInstance.checkAuth("send follow requests")) return;
  const res = window.AppState.toggleFollow(targetId, targetName);
  window.showToast(res.message, res.status === "mutual" ? "success" : "info");
};

window.handleSubscribeClick = function(creatorId, creatorName) {
  if (!window.MediaModuleInstance.checkAuth("subscribe to creator channels")) return;
  const subbed = window.AppState.toggleSubscribe(creatorId);
  window.showToast(subbed ? `Subscribed to ${creatorName}! 🔔` : `Unsubscribed from ${creatorName}`, "info");
};

window.handleAddComment = function(e, postId) {
  e.preventDefault();
  if (!window.MediaModuleInstance.checkAuth("comment on posts")) return;

  const input = document.getElementById(`comment-input-${postId}`);
  if (!input || !input.value.trim()) return;

  const commentText = input.value.trim();
  const post = window.MediaModuleInstance.posts.find((p) => p.id === postId);
  if (post) {
    post.comments.push({
      author: window.AppState.currentUser.name,
      text: commentText
    });
    window.MockStore.saveMediaPosts(window.MediaModuleInstance.posts);

    const list = document.getElementById(`comments-list-${postId}`);
    if (list) {
      const row = document.createElement("div");
      row.className = "comment-row";
      row.innerHTML = `<span class="comment-author-name">${window.AppState.currentUser.name}:</span> <span class="comment-text">${commentText}</span>`;
      list.appendChild(row);
    }
    input.value = "";
    window.showToast("Comment posted!", "success");
  }
};

window.simulatePlayVideo = function(postId) {
  const overlay = document.getElementById(`overlay-${postId}`);
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    window.showToast("Streaming HD Video Reel...", "info");
    setTimeout(() => {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
    }, 8000);
  }
};

window.toggleComments = function(postId) {
  const sec = document.getElementById(`comments-section-${postId}`);
  if (sec) {
    sec.style.display = sec.style.display === "none" ? "block" : "none";
  }
};
