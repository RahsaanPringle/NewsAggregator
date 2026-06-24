function DashboardCardMenu({ menuId }) {
  return (
    <div className="dropdown no-arrow">
      <a className="dropdown-toggle" href="#" role="button" id={menuId} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
      </a>
      <div className="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby={menuId}>
        <div className="dropdown-header">Dropdown Header:</div>
        <a className="dropdown-item" href="#">
          Action
        </a>
        <a className="dropdown-item" href="#">
          Another action
        </a>
        <div className="dropdown-divider"></div>
        <a className="dropdown-item" href="#">
          Something else here
        </a>
      </div>
    </div>
  )
}

export default DashboardCardMenu