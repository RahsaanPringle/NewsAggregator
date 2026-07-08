import { useEffect, useState } from 'react'
import DashboardContent from './components/DashboardContent'
import Footer from './components/Footer'
import Overlays from './components/Overlays'
import Sidebar from './components/Sidebar'
import SingleArticleView from './components/SingleArticleView'
import Topbar from './components/Topbar'
import { getArticleHashFromPath } from './utils/articleLinks'

const coreScripts = [
  '/vendor/jquery/jquery.min.js',
  '/vendor/bootstrap/js/bootstrap.bundle.min.js',
  '/vendor/jquery-easing/jquery.easing.min.js',
  '/js/sb-admin-2.min.js',
  '/vendor/chart.js/Chart.min.js',
  '/vendor/datatables/jquery.dataTables.min.js',
  '/vendor/datatables/dataTables.bootstrap4.min.js',
]

const pageScripts = []

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-sb-script="${src}"]`)

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve(existing)
        return
      }

      existing.addEventListener('load', () => resolve(existing), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.sbScript = src
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve(script)
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    })
    document.body.appendChild(script)
  })
}

function reloadPageScript(src) {
  return new Promise((resolve, reject) => {
    document
      .querySelectorAll(`script[data-sb-page-script="${src}"]`)
      .forEach((element) => element.remove())

    const script = document.createElement('script')
    script.src = `${src}?v=${Date.now()}`
    script.async = false
    script.dataset.sbPageScript = src
    script.addEventListener('load', () => resolve(script), { once: true })
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    document.body.appendChild(script)
  })
}

function destroyExistingCharts() {
  const chartApi = window.Chart
  if (!chartApi || !chartApi.instances) {
    return
  }

  Object.values(chartApi.instances).forEach((chart) => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy()
    }
  })
}

function App() {
  const [scriptsReady, setScriptsReady] = useState(false)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    document.body.id = 'page-top'

    let cancelled = false
    const loadScripts = async () => {
      for (const script of coreScripts) {
        if (cancelled) {
          break
        }

        // Keep execution order deterministic for jQuery plugins and chart support.
        await loadScriptOnce(script)
      }

      if (cancelled) {
        return
      }

      setScriptsReady(true)

      // React re-renders can replace canvas nodes, so clear previous Chart instances first.
      destroyExistingCharts()

      for (const script of pageScripts) {
        if (cancelled) {
          break
        }

        await reloadPageScript(script)
      }
    }

    void loadScripts()

    return () => {
      cancelled = true
      document.body.removeAttribute('id')
    }
  }, [])

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const articleHash = getArticleHashFromPath(pathname)

  return (
    <>
      <div id="wrapper">
        <Sidebar />

        <div id="content-wrapper" className="d-flex flex-column">
          <div id="content">
            <Topbar />
            <div className="container-fluid">
              {articleHash ? (
                <SingleArticleView articleHash={articleHash} />
              ) : (
                <DashboardContent scriptsReady={scriptsReady} />
              )}
            </div>
          </div>

          <Footer />
        </div>
      </div>

      <Overlays />
    </>
  )
}

export default App
