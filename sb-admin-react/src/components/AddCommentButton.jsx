function AddCommentButton({ className = 'btn btn-sm btn-outline-success', children = 'Add Comment', ...rest }) {
  return (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  )
}

export default AddCommentButton
