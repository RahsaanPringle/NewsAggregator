import DashboardRowThreeNewsCoverage from './DashboardRowThreeNewsCoverage'
import DashboardRowThreeWorldHeadlinesCards from './DashboardRowThreeWorldHeadlinesCards'

function DashboardRowThree({ scriptsReady }) {
  return (
    <div className="row">
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeWorldHeadlinesCards scriptsReady={scriptsReady} />
      </div>
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeNewsCoverage scriptsReady={scriptsReady} />
      </div>


    </div>
  )
}

export default DashboardRowThree
