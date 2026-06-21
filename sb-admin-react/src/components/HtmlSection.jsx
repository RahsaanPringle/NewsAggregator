function HtmlSection({ html, tag: Tag = 'div' }) {
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />
}

export default HtmlSection
