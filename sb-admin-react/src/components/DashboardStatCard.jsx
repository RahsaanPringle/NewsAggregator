function DashboardStatCard({ borderClass, titleClass, title, value, iconClass, progressPercent, helpText }) {
  return (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className={`card ${borderClass} shadow h-100 py-2`}>
        <div className="card-body">
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className={`text-xs font-weight-bold ${titleClass} text-uppercase mb-1`}>{title}</div>
              {typeof progressPercent === 'number' ? (
                <div className="row no-gutters align-items-center">
                  <div className="col-auto">
                    <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{progressPercent}%</div>
                  </div>
                  <div className="col">
                    <div className="progress progress-sm mr-2">
                      <div
                        className="progress-bar bg-info"
                        role="progressbar"
                        style={{ width: `${progressPercent}%` }}
                        aria-valuenow={progressPercent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h5 mb-0 font-weight-bold text-gray-800">{value}</div>
              )}
              {helpText ? <div className="small text-gray-500 mt-2">{helpText}</div> : null}
            </div>
            <div className="col-auto">
              <i className={`${iconClass} fa-2x text-gray-300`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStatCard