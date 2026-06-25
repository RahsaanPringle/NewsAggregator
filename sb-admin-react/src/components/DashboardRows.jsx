import DashboardRowOne from './DashboardRowOne'
import DashboardRowTwo from './DashboardRowTwo'
import DashboardRowThree from './DashboardRowThree'
import DashboardRowFour from './DashboardRowFour'

function DashboardRows({ scriptsReady }) {
  return (
    <>
      <DashboardRowTwo scriptsReady={scriptsReady} />
      <DashboardRowThree scriptsReady={scriptsReady} />
      
      

      <DashboardRowOne />

      <DashboardRowFour />
    </>
  )
}

export default DashboardRows
