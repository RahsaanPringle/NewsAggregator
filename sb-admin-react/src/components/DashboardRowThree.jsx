import NewsDataTable from './NewsDataTable'

function DashboardRowThree({ scriptsReady }) {
  return (
    <div className="row">
      <div className="col-lg-6 mb-4">
        <div className="card shadow mb-4">
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

        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card bg-primary text-white shadow">
              <div className="card-body">
                Primary
                <div className="text-white-50 small">#4e73df</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-success text-white shadow">
              <div className="card-body">
                Success
                <div className="text-white-50 small">#1cc88a</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-info text-white shadow">
              <div className="card-body">
                Info
                <div className="text-white-50 small">#36b9cc</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-warning text-white shadow">
              <div className="card-body">
                Warning
                <div className="text-white-50 small">#f6c23e</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-danger text-white shadow">
              <div className="card-body">
                Danger
                <div className="text-white-50 small">#e74a3b</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-secondary text-white shadow">
              <div className="card-body">
                Secondary
                <div className="text-white-50 small">#858796</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-light text-black shadow">
              <div className="card-body">
                Light
                <div className="text-black-50 small">#f8f9fc</div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card bg-dark text-white shadow">
              <div className="card-body">
                Dark
                <div className="text-white-50 small">#5a5c69</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-6 mb-4">
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

        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Development Approach</h6>
          </div>
          <div className="card-body">
            <p>
              SB Admin 2 makes extensive use of Bootstrap 4 utility classes in order to reduce CSS bloat and poor page
              performance. Custom CSS classes are used to create custom components and custom utility classes.
            </p>
            <p className="mb-0">
              Before working with this theme, you should become familiar with the Bootstrap framework, especially the
              utility classes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardRowThree
