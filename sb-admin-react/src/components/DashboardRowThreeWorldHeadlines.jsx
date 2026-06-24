import NewsDataTable from './NewsDataTable'

function DashboardRowThreeWorldHeadlines({ scriptsReady }) {
  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">World Headlines</h6>
      </div>
      <div className="card-body">
        <NewsDataTable
          scriptsReady={scriptsReady}
          title="World Topic Headlines"
          subtitle="WORLD topic feed from RapidAPI"
          endpointPath="/topic-headlines"
          queryParams={{
            topic: 'WORLD',
            limit: 500,
            country: 'US',
            lang: 'en',
          }}
          tableId="worldTopicHeadlinesTable"
          loadingLabel="Loading world headlines…"
          emptyLabel="No headlines returned for this topic."
          errorLabel="Unable to load world headlines."
        />
      </div>
    </div>
  )
}

export default DashboardRowThreeWorldHeadlines