import DashboardRows from './DashboardRows'
import PageHeading from './PageHeading'

function DashboardContent({ scriptsReady }) {
  return (
    <div className="container-fluid">
      <PageHeading />
      <DashboardRows scriptsReady={scriptsReady} />
    </div>
  )
}

export default DashboardContent
