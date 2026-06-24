import DashboardStatCard from './DashboardStatCard'

const STAT_CARDS = [
  {
    borderClass: 'border-left-primary',
    titleClass: 'text-primary',
    title: 'Earnings (Monthly)',
    value: '$40,000',
    iconClass: 'fas fa-calendar',
  },
  {
    borderClass: 'border-left-success',
    titleClass: 'text-success',
    title: 'Earnings (Annual)',
    value: '$215,000',
    iconClass: 'fas fa-dollar-sign',
  },
  {
    borderClass: 'border-left-info',
    titleClass: 'text-info',
    title: 'Tasks',
    progressPercent: 50,
    iconClass: 'fas fa-clipboard-list',
  },
  {
    borderClass: 'border-left-warning',
    titleClass: 'text-warning',
    title: 'Pending Requests',
    value: '18',
    iconClass: 'fas fa-comments',
  },
]

function DashboardRowOne() {
  return (
    <div className="row">
      {STAT_CARDS.map((card) => (
        <DashboardStatCard
          key={card.title}
          borderClass={card.borderClass}
          titleClass={card.titleClass}
          title={card.title}
          value={card.value}
          iconClass={card.iconClass}
          progressPercent={card.progressPercent}
        />
      ))}
    </div>
  )
}

export default DashboardRowOne
