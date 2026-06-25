import DashboardRowThreeNewsCoverage from './DashboardRowThreeNewsCoverage'
import DashboardThemeColorCards from './DashboardThemeColorCards'
import DashboardRowThreeWorldHeadlines from './DashboardRowThreeWorldHeadlines'
import DashboardRowThreeDevelopmentApproach from './DashboardRowThreeDevelopmentApproach'

function DashboardRowThree({ scriptsReady }) {
  return (
    <div className="row">
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeNewsCoverage scriptsReady={scriptsReady} />
      </div>

      <div className="col-lg-12 mb-4">
        <DashboardRowThreeWorldHeadlines scriptsReady={scriptsReady} />
      </div>

      <div className="col-lg-12 mb-4">
        <DashboardRowThreeDevelopmentApproach />
        <DashboardThemeColorCards />
      </div>
    </div>
  )
}

export default DashboardRowThree
