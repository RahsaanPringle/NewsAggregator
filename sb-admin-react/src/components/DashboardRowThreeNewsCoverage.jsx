import NewsDataTable from './NewsDataTable'

function DashboardRowThreeNewsCoverage({ scriptsReady }) {
  return (
    <div className="card shadow mb-4 DashboardRowThreeNewsCoverage">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">News Coverage</h6>
      </div>
      <div className="card-body">
        <NewsDataTable
          scriptsReady={scriptsReady}
          title="Full Story Coverage"
          subtitle="Live results from RapidAPI"
          endpointPath="/full-story-coverage"
          queryParams={{
            story: 'CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pibk5UN0VCSDVpWndxM3pJc0hDZ0FQAQ',
            sort: 'RELEVANCE',
            country: 'US',
            lang: 'en',
          }}
          tableId="fullStoryCoverageTable"
          loadingLabel="Loading story coverage…"
          emptyLabel="No articles returned for this story."
          errorLabel="Unable to load story coverage."
        />
      </div>
    </div>
  )
}

export default DashboardRowThreeNewsCoverage