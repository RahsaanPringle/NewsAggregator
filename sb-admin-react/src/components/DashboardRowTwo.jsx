import DashboardRowTwoNewsVolumeOverview from './DashboardRowTwoNewsVolumeOverview'
import DashboardRowTwoNewsSourceDistribution from './DashboardRowTwoNewsSourceDistribution'

function DashboardRowTwo({ scriptsReady }) {
  return (
    <div className="row">
      <DashboardRowTwoNewsSourceDistribution scriptsReady={scriptsReady} />
      <DashboardRowTwoNewsVolumeOverview scriptsReady={scriptsReady} />
      
      
    </div>
  )
}

export default DashboardRowTwo
