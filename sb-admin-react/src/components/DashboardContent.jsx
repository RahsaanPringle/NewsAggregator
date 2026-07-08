import DashboardRows from './DashboardRows'
import DashboardHeroArticles from './DashboardHeroArticles'
import PageHeading from './PageHeading'

function DashboardContent({ scriptsReady }) {
  return (
    <>
      <PageHeading />
      <DashboardHeroArticles />
      <DashboardRows scriptsReady={scriptsReady} />
    </>
  )
}

export default DashboardContent
