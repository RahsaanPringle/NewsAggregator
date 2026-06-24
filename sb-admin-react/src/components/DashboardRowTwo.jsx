import DashboardRowTwoEarningsOverview from './DashboardRowTwoEarningsOverview'
import DashboardRowTwoRevenueSources from './DashboardRowTwoRevenueSources'

function DashboardRowTwo() {
  return (
    <div className="row">
      <DashboardRowTwoEarningsOverview />
      <DashboardRowTwoRevenueSources />
    </div>
  )
}

export default DashboardRowTwo
