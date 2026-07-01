import DashboardRowThreeWorldHeadlinesCards from './DashboardRowThreeWorldHeadlinesCards'
import DashboardRowThreeNewsCoverageCards from './DashboardRowThreeNewsCoverageCards'
import DashboardRowThreeBusinessNewsCards from './DashboardRowThreeBusinessNewsCards'

function DashboardRowThree({ scriptsReady }) {
  return (
    <div className="row">
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeWorldHeadlinesCards scriptsReady={scriptsReady} />
      </div>
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeNewsCoverageCards scriptsReady={scriptsReady} />
      </div>
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeBusinessNewsCards scriptsReady={scriptsReady} />
      </div>
    </div>
  )
}

export default DashboardRowThree
