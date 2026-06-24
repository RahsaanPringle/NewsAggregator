const COLOR_CARDS = [
  { label: 'Primary', hex: '#4e73df', bgClass: 'bg-primary', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Success', hex: '#1cc88a', bgClass: 'bg-success', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Info', hex: '#36b9cc', bgClass: 'bg-info', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Warning', hex: '#f6c23e', bgClass: 'bg-warning', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Danger', hex: '#e74a3b', bgClass: 'bg-danger', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Secondary', hex: '#858796', bgClass: 'bg-secondary', textClass: 'text-white', metaTextClass: 'text-white-50' },
  { label: 'Light', hex: '#f8f9fc', bgClass: 'bg-light', textClass: 'text-black', metaTextClass: 'text-black-50' },
  { label: 'Dark', hex: '#5a5c69', bgClass: 'bg-dark', textClass: 'text-white', metaTextClass: 'text-white-50' },
]

function DashboardThemeColorCards() {
  return (
    <div className="row">
      {COLOR_CARDS.map((card) => (
        <div className="col-lg-6 mb-4" key={card.label}>
          <div className={`card ${card.bgClass} ${card.textClass} shadow`}>
            <div className="card-body">
              {card.label}
              <div className={`${card.metaTextClass} small`}>{card.hex}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DashboardThemeColorCards