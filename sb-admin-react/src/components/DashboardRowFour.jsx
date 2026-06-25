import DashboardThemeColorCards from './DashboardThemeColorCards'
import DashboardRowThreeDevelopmentApproach from './DashboardRowThreeDevelopmentApproach'

function DashboardRowFour() {
  return (
    <div className="row">
      <div className="col-lg-12 mb-4">
        <DashboardRowThreeDevelopmentApproach />
        <DashboardThemeColorCards />
      </div>
    </div>
  )
}

export default DashboardRowFour
