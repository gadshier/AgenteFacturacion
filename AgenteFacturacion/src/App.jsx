import { useMemo, useState } from 'react'
import './App.css'

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://<TU-EC2-IP>:8080/facturar'

function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState(null)

  const enviarPrompt = async () => {
    setError('')
    setInvoice(null)

    const payload = { prompt }

    try {
      setLoading(true)
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('No se pudo obtener respuesta del backend')
      }

      const data = await response.json()
      recibirRespuesta(data)
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const recibirRespuesta = (data) => {
    if (data?.status === 'ok' && data?.factura) {
      setInvoice(data.factura)
    } else {
      setError('Respuesta del backend no válida')
    }
  }

  const totals = useMemo(() => {
    if (!invoice) return null
    const neto = invoice.neto || 0
    const igv = invoice.igv || 0
    const total = invoice.total || neto + igv
    return { neto, igv, total }
  }, [invoice])

  const handleGeneratePdf = () => {
    if (!invoice) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setError('El bloqueador de ventanas emergentes impidió crear el PDF')
      return
    }

    const { cliente, ruc, items = [] } = invoice
    const { neto = 0, igv = 0, total = 0 } = totals || {}

    const rows = items
      .map(
        (item) => `
        <tr>
          <td>${item.descripcion}</td>
          <td class="number">${item.cantidad}</td>
          <td class="number">${item.precio.toFixed(2)}</td>
          <td class="number">${item.subtotal.toFixed(2)}</td>
        </tr>`
      )
      .join('')

    const printableHtml = `
      <html>
        <head>
          <title>Factura ${cliente || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            h2 { margin: 0 0 16px 0; color: #475569; }
            .meta { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 14px; }
            th { background: #e2e8f0; text-align: left; }
            .number { text-align: right; }
            .totals { margin-top: 12px; width: 100%; }
            .totals td { border: none; padding: 4px 0; font-size: 14px; }
            .totals .label { text-align: right; padding-right: 12px; color: #475569; }
            .totals .value { text-align: right; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Factura</h1>
          <h2>${cliente || 'Cliente'}</h2>
          <div class="meta">RUC: ${ruc || '-'}</div>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <table class="totals">
            <tbody>
              <tr><td class="label">Neto:</td><td class="value">${neto.toFixed(2)}</td></tr>
              <tr><td class="label">IGV:</td><td class="value">${igv.toFixed(2)}</td></tr>
              <tr><td class="label">Total:</td><td class="value">${total.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printableHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-text">
          <p className="tag">Agente de Facturación</p>
          <h1>Agente de Facturación – MVP</h1>
          <p className="subtitle">Generador de facturas desde lenguaje natural.</p>
          <div className="hero-grid">
            <div className="pill">Flujo guiado de prompt & API</div>
            <div className="pill light">Salida lista para PDF</div>
          </div>
        </div>
        <div className="hero-card">
          <p className="label">Endpoint activo</p>
          <p className="url">{BACKEND_URL}</p>
          <p className="hint">Sustituye &lt;TU-EC2-IP&gt; por tu host.</p>
        </div>
      </header>

      <main className="layout">
        <section className="card form-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Prompt</p>
              <h2>Describe la factura</h2>
              <p className="description">
                Redacta el detalle en lenguaje natural. Enviamos el JSON al backend y
                mostramos la respuesta tal cual llega.
              </p>
            </div>
            <div className="badge muted">Paso 1</div>
          </div>

          <div className="field-group">
            <label htmlFor="prompt">Instrucciones</label>
            <textarea
              id="prompt"
              name="prompt"
              placeholder="Ejemplo: Crear factura para Acme SAC con 3 laptops a 1500 y 2 teclados a 50..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          <div className="actions">
            <button
              className="primary"
              onClick={enviarPrompt}
              disabled={!prompt.trim() || loading}
            >
              {loading ? 'Enviando...' : 'Enviar al backend'}
            </button>
            <p className="hint">
              Recibirás exactamente el JSON retornado por el servicio.
            </p>
          </div>

          {error && <div className="alert">{error}</div>}
        </section>

        <section className="card response-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Salida</p>
              <h2>Factura generada</h2>
              <p className="description">
                Visualiza la estructura devuelta por el backend y descárgala en PDF.
              </p>
            </div>
            <div className="badge muted">Paso 2</div>
          </div>

          {!invoice && (
            <div className="empty">
              <p className="empty-title">Aún no hay datos</p>
              <p className="empty-text">
                Envía un prompt para previsualizar la factura y habilitar la descarga.
              </p>
            </div>
          )}

          {invoice && (
            <>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Respuesta del backend</p>
                  <h3>{invoice.cliente}</h3>
                  <p className="meta">RUC: {invoice.ruc}</p>
                </div>
                <button className="secondary" onClick={handleGeneratePdf}>
                  Descargar PDF
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={`${item.descripcion}-${index}`}>
                        <td>{item.descripcion}</td>
                        <td className="number">{item.cantidad}</td>
                        <td className="number">{item.precio.toFixed(2)}</td>
                        <td className="number">{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totals && (
                <div className="totals">
                  <div>
                    <span>Neto</span>
                    <strong>{totals.neto.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>IGV</span>
                    <strong>{totals.igv.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{totals.total.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
