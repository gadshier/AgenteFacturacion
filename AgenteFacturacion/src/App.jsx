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
      <header className="header">
        <div>
          <p className="eyebrow">Agente de Facturación</p>
          <h1>Genera tu factura a partir de un prompt</h1>
          <p className="subtitle">
            Envía el detalle como texto, espera la respuesta del backend y descarga el PDF.
          </p>
        </div>
        <div className="badge">Vite + React</div>
      </header>

      <section className="panel">
        <div className="field-group">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            name="prompt"
            placeholder="Escribe aquí las instrucciones para generar la factura"
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
            La solicitud se envía a <span className="code">{BACKEND_URL}</span>
          </p>
        </div>

        {error && <div className="alert">{error}</div>}
      </section>

      {invoice && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Respuesta del backend</p>
              <h2>{invoice.cliente}</h2>
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
        </section>
      )}
    </div>
  )
}

export default App
