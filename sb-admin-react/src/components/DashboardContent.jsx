import DashboardRows from './DashboardRows'
import DashboardHeroArticles from './DashboardHeroArticles'
import PageHeading from './PageHeading'

function DashboardContent({ scriptsReady }) {
  return (
    <div className="container-fluid">
      <PageHeading />
      <DashboardHeroArticles />
      <DashboardRows scriptsReady={scriptsReady} />
    </div>
  )
}

export default DashboardContent
