import DashboardRowOne from './DashboardRowOne'
import DashboardRowTwo from './DashboardRowTwo'
import DashboardRowThree from './DashboardRowThree'

function DashboardRows({ scriptsReady }) {
  return (
    <>
      <DashboardRowOne />
      <DashboardRowTwo />
      <DashboardRowThree scriptsReady={scriptsReady} />
    </>
  )
}

export default DashboardRows
