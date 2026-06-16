// Strangler-fig React entry (1단계 toolchain proof — see MIGRATION_LOG.md).
//
// This intentionally renders NOTHING visible. Its only job right now is to
// prove that the Vite build + coexistence works and that React can mount on
// the existing vanilla page without changing a single pixel. Real screens
// will be migrated into this mount point ONE AT A TIME in later steps.
//
// The vanilla app keeps owning the page; React shares the same window globals
// (e.g. window.opsRadarApi, window.G) when a screen is actually migrated.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const mountEl = document.getElementById('react-mount')
if (mountEl) {
  // Empty fragment: exercises the JSX/React pipeline but paints nothing.
  createRoot(mountEl).render(<StrictMode></StrictMode>)
}
