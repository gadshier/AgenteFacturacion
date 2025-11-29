import { useMemo, useRef, useState } from 'react'
import './App.css'

const simulatedResponse = {
  status: 'ok',
  factura: {
    cliente: 'ACME S.A.',
    ruc: '12345678901',
    items: [
      { descripcion: 'Laptop', cantidad: 3, precio: 1500, subtotal: 4500 },
      { descripcion: 'Teclado', cantidad: 2, precio: 50, subtotal: 100 },
    ],
    subtotal: 4600,
    igv: 828,
    total: 5428,
  },
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)

function App() {
  const [prompt, setPrompt] = useState('genera una factura a ACME por 3 laptops a 1500 y 2 teclados a 50')
  const [response, setResponse] = useState(null)
  const invoiceRef = useRef(null)

  const handleSend = () => {
    setResponse(simulatedResponse)
  }

  const handleExportJSON = () => {
    if (!response) return

    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'factura.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportHTML = () => {
    if (!response || !invoiceRef.current) return

    const htmlBlob = new Blob([invoiceRef.current.innerHTML], { type: 'text/html' })
    const url = URL.createObjectURL(htmlBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'factura.html'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    if (!response || !invoiceRef.current) return

    const invoiceContent = invoiceRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=900,height=1100')

    if (!printWindow) return

    const styles = `
      <style>
        body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f5f5f5; }
        .invoice-card { max-width: 820px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 18px; padding: 24px; background: #ffffff; }
        .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        th { background: #f8fafc; color: #475569; font-weight: 700; }
        .summary { margin-top: 16px; width: 320px; margin-left: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }
        .summary-row { display: flex; justify-content: space-between; font-weight: 700; padding: 8px 0; }
        .summary-row + .summary-row { border-top: 1px dashed #e5e7eb; }
      </style>
    `

    printWindow.document.write(`<!doctype html><html><head><title>Factura</title>${styles}</head><body>${invoiceContent}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 200)
  }

  const invoice = useMemo(() => response?.factura ?? null, [response])
  const hasResponse = Boolean(response)

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">Simulador</p>
          <h1>Generador de factura asistido</h1>
          <p className="lede">
            Ingresa un prompt y presiona «Enviar» para simular el pedido al backend. El frontend solo
            muestra los datos que recibe.
          </p>
        </div>
        <div className="status-pill">Sin conexión real</div>
      </header>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Entrada</p>
            <h2>Prompt en lenguaje natural</h2>
          </div>
          <button type="button" className="primary" onClick={handleSend}>
            Enviar
          </button>
        </div>
        <label className="field">
          <span>Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Describe la factura que deseas generar"
          />
        </label>
      </section>

      <div className="content-grid">
        <section className="panel json">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Respuesta simulada</p>
              <h2>Vista previa del JSON</h2>
            </div>
            <div className="actions">
              <button type="button" disabled={!hasResponse} onClick={handleExportJSON}>
                Exportar JSON
              </button>
              <button type="button" disabled={!hasResponse} onClick={handleExportHTML}>
                Exportar HTML
              </button>
              <button type="button" className="primary" disabled={!hasResponse} onClick={handleExportPDF}>
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="code-block">
            {hasResponse ? (
              <pre>{JSON.stringify(response, null, 2)}</pre>
            ) : (
              <div className="empty-preview">
                <p>Envía un prompt para ver la respuesta formateada aquí.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel invoice">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Factura</p>
              <h2>Vista previa en HTML</h2>
            </div>
            <p className="note">Render de solo lectura con los datos recibidos</p>
          </div>

          {invoice ? (
            <div className="invoice-card" ref={invoiceRef}>
              <div className="invoice-ribbon" aria-hidden>Factura electrónica</div>
              <div className="invoice-meta">
                <div>
                  <p className="label">Cliente</p>
                  <p className="value">{invoice.cliente}</p>
                </div>
                <div>
                  <p className="label">RUC</p>
                  <p className="value">{invoice.ruc}</p>
                </div>
                <div className="stamp">SUNAT</div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={`${item.descripcion}-${item.cantidad}-${item.precio}`}>
                      <td>{item.descripcion}</td>
                      <td>{item.cantidad}</td>
                      <td>{formatCurrency(item.precio)}</td>
                      <td>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>IGV</span>
                  <span>{formatCurrency(invoice.igv)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Presiona «Enviar» para mostrar la factura recibida.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
