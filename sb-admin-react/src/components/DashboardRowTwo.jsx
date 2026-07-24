import { useEffect, useRef, useState } from 'react'
import DashboardRowTwoNewsVolumeOverview from './DashboardRowTwoNewsVolumeOverview'
import DashboardRowTwoNewsSourceDistribution from './DashboardRowTwoNewsSourceDistribution'

const CHART_SCRIPT_URL = '/vendor/chart.js/Chart.min.js'
let chartScriptPromise

function loadChartScript() {
  if (window.Chart) {
    return Promise.resolve()
  }

  if (chartScriptPromise) {
    return chartScriptPromise
  }

  chartScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${CHART_SCRIPT_URL}"]`)
    const script = existingScript || document.createElement('script')

    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', () => reject(new Error(`Failed to load ${CHART_SCRIPT_URL}`)), { once: true })

    if (!existingScript) {
      script.src = CHART_SCRIPT_URL
      document.body.appendChild(script)
    }
  }).catch((error) => {
    chartScriptPromise = undefined
    throw error
  })

  return chartScriptPromise
}

function DashboardRowTwo({ scriptsReady }) {
  const rowRef = useRef(null)
  const [chartReady, setChartReady] = useState(() => Boolean(window.Chart))

  useEffect(() => {
    const row = rowRef.current
    if (!row || chartReady) {
      return undefined
    }

    let cancelled = false
    const loadChart = () => {
      void loadChartScript().then(() => {
        if (!cancelled) {
          setChartReady(true)
        }
      }).catch(() => {})
    }

    if (!('IntersectionObserver' in window)) {
      loadChart()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          loadChart()
        }
      },
      { rootMargin: '0px 0px -50px 0px' },
    )

    observer.observe(row)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [chartReady])

  return (
    <div className="row" ref={rowRef}>
      <DashboardRowTwoNewsSourceDistribution scriptsReady={scriptsReady && chartReady} />
      <DashboardRowTwoNewsVolumeOverview scriptsReady={scriptsReady && chartReady} />
    </div>
  )
}

export default DashboardRowTwo
