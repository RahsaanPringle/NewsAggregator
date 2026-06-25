import DashboardRowTwoNewsVolumeOverview from './DashboardRowTwoNewsVolumeOverview'
import DashboardRowTwoNewsSourceDistribution from './DashboardRowTwoNewsSourceDistribution'

function DashboardRowTwo({ scriptsReady }) {
  return (
    <div className="row">
      <DashboardRowTwoNewsVolumeOverview scriptsReady={scriptsReady} />
      <DashboardRowTwoNewsSourceDistribution scriptsReady={scriptsReady} />
    </div>
  )
}

export default DashboardRowTwo
