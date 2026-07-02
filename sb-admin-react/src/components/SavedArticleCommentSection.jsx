import ArticleCommentsPanel from './ArticleCommentsPanel'
import AddCommentButton from './AddCommentButton'

function SavedArticleCommentSection({
  articleHash,
  articleTitle,
  articleComments,
  selectedCommentArticle,
  onOpenComment,
  onCloseComment,
  onCommentCreated,
}) {
  const isCommentsPanelOpen = selectedCommentArticle?.articleHash === articleHash
  const featuredComment = articleComments.length ? articleComments[0] : null

  return (
    <div className="mb-3">
      <div className="btn-group btn-group-sm mb-2" role="group" aria-label="Saved article actions">
        <span className="btn btn-sm btn-outline-success disabled">Saved</span>
        <AddCommentButton
          className="btn btn-sm btn-outline-success"
          onClick={() => {
            onOpenComment({
              articleHash,
              articleTitle,
              startComposerOpen: true,
            })
          }}
        >
          Add Comment
        </AddCommentButton>
      </div>
      <div className="small text-success font-weight-bold">
        {articleComments.length ? `${articleComments.length} comment${articleComments.length === 1 ? '' : 's'}` : 'No comments yet'}
      </div>

      {!isCommentsPanelOpen && featuredComment ? (
        <article className="border rounded p-3 mt-2">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center">
              {featuredComment.user?.profile_thumbnail_data_url ? (
                <img
                  src={featuredComment.user.profile_thumbnail_data_url}
                  alt={featuredComment.user.display_name || 'Comment user'}
                  width="36"
                  height="36"
                  className="rounded-circle mr-2"
                />
              ) : null}
              <div>
                <div className="font-weight-bold text-gray-800">{featuredComment.user?.display_name || 'Guest Commenter'}</div>
                <div className="small text-gray-500">
                  {featuredComment.user?.username ? `@${featuredComment.user.username}` : 'Guest profile'}
                </div>
              </div>
            </div>
            {featuredComment.id ? (
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                onClick={() => {
                  onOpenComment({
                    articleHash,
                    articleTitle,
                    startComposerOpen: false,
                    replyCommentId: featuredComment.id,
                  })
                }}
              >
                Reply
              </button>
            ) : null}
          </div>
          <p className="mb-0 text-gray-800">{featuredComment.body}</p>
        </article>
      ) : null}

      {isCommentsPanelOpen ? (
        <div className="mt-3 pt-3 border-top">
          <ArticleCommentsPanel
            articleHash={selectedCommentArticle.articleHash}
            articleTitle={selectedCommentArticle.articleTitle}
            startComposerOpen={selectedCommentArticle.startComposerOpen}
            initialReplyCommentId={selectedCommentArticle.replyCommentId ?? null}
            onCommentCreated={(createdComment) => onCommentCreated(selectedCommentArticle.articleHash, createdComment)}
            onClose={onCloseComment}
          />
        </div>
      ) : null}
    </div>
  )
}

export default SavedArticleCommentSection
