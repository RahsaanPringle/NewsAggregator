import DashboardArticlesCollectedTodayCard from './DashboardArticlesCollectedTodayCard'
import DashboardCommentRevenueCard from './DashboardCommentRevenueCard'
import DashboardCommentsWithResponsesCard from './DashboardCommentsWithResponsesCard'
import DashboardCommentsWithoutResponsesCard from './DashboardCommentsWithoutResponsesCard'

function DashboardRowOne() {
  return (
    <div className="row">
      <DashboardArticlesCollectedTodayCard />
      <DashboardCommentRevenueCard />
      <DashboardCommentsWithResponsesCard />
      <DashboardCommentsWithoutResponsesCard />
    </div>
  )
}

export default DashboardRowOne
