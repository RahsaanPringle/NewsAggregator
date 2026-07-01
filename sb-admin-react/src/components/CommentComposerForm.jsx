import AddCommentButton from './AddCommentButton'

function CommentComposerForm({
  isOpen,
  showTrigger = true,
  triggerLabel = 'Add Comment',
  triggerClassName = 'btn btn-success btn-sm',
  formClassName = 'mb-4',
  textareaId,
  label,
  placeholder,
  body,
  submitting,
  consentIpAddress,
  consentLocation,
  locationStatus,
  submitError,
  submitButtonLabel,
  onOpen,
  onBodyChange,
  onConsentIpAddressChange,
  onConsentLocationChange,
  onSubmit,
  onCancel,
}) {
  const canSubmit = Boolean(body?.trim())

  return (
    <>
      {!isOpen && showTrigger ? (
        <AddCommentButton className={triggerClassName} onClick={onOpen}>
          {triggerLabel}
        </AddCommentButton>
      ) : null}

      {isOpen ? (
        <form onSubmit={onSubmit} className={formClassName}>
          <div className="form-group">
            <label htmlFor={textareaId} className="small text-gray-700 font-weight-bold">
              {label}
            </label>
            <textarea
              id={textareaId}
              className="form-control"
              rows="3"
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              placeholder={placeholder}
              disabled={submitting}
            />
          </div>

          <div className="form-check mb-2">
            <input
              id={`${textareaId}-consent-ip`}
              className="form-check-input"
              type="checkbox"
              checked={consentIpAddress}
              onChange={(event) => onConsentIpAddressChange(event.target.checked)}
              disabled={submitting}
            />
            <label className="form-check-label small" htmlFor={`${textareaId}-consent-ip`}>
              Use my IP address as a return identifier for this profile.
            </label>
          </div>

          <div className="form-check mb-3">
            <input
              id={`${textareaId}-consent-location`}
              className="form-check-input"
              type="checkbox"
              checked={consentLocation}
              onChange={(event) => onConsentLocationChange(event.target.checked)}
              disabled={submitting}
            />
            <label className="form-check-label small" htmlFor={`${textareaId}-consent-location`}>
              Try to include my current browser location too.
            </label>
          </div>

          {locationStatus ? <div className="small text-gray-500 mb-3">{locationStatus}</div> : null}
          {submitError ? (
            <div className="alert alert-warning" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="d-flex align-items-center">
            <button type="submit" className="btn btn-success btn-sm mr-2" disabled={submitting || !canSubmit}>
              {submitting ? 'Posting…' : submitButtonLabel}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" disabled={submitting} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </>
  )
}

export default CommentComposerForm
