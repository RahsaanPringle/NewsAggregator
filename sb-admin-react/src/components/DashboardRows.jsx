import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import DashboardRowOne from './DashboardRowOne'
import DashboardRowTwo from './DashboardRowTwo'

const DashboardRowThree = lazy(() => import('./DashboardRowThree'))

function DeferredDashboardRowThree({ scriptsReady }) {
  const placeholderRef = useRef(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const placeholder = placeholderRef.current
    if (!placeholder || shouldRender) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )

    observer.observe(placeholder)
    return () => observer.disconnect()
  }, [shouldRender])

  if (!shouldRender) {
    return <div ref={placeholderRef} style={{ minHeight: '24rem' }} aria-hidden="true" />
  }

  return (
    <Suspense fallback={<div style={{ minHeight: '24rem' }} aria-hidden="true" />}>
      <DashboardRowThree scriptsReady={scriptsReady} />
    </Suspense>
  )
}

function DashboardRows({ scriptsReady }) {
  return (
    <>
      <DashboardRowOne />
      <DashboardRowTwo scriptsReady={scriptsReady} />
      <DeferredDashboardRowThree scriptsReady={scriptsReady} />
    </>
  )
}

export default DashboardRows
