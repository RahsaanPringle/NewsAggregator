import DashboardCardMenu from './DashboardCardMenu'

function DashboardRowTwoEarningsOverview() {
  return (
    <div className="col-xl-8 col-lg-7">
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">Earnings Overview</h6>
          <DashboardCardMenu menuId="earningsDropdownMenu" />
        </div>
        <div className="card-body">
          <div className="chart-area">
            <canvas id="myAreaChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardRowTwoEarningsOverview