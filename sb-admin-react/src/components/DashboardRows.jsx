import DashboardRowOne from './DashboardRowOne'
import DashboardRowTwo from './DashboardRowTwo'
import DashboardRowThree from './DashboardRowThree'

function DashboardRows({ scriptsReady }) {
  return (
    <>
      <DashboardRowThree scriptsReady={scriptsReady} />
      <DashboardRowOne />
      <DashboardRowTwo scriptsReady={scriptsReady} />
    </>
  )
}

export default DashboardRows
