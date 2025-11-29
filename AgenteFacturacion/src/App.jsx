import { useMemo, useState } from 'react'
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

  const handleSend = () => {
    setResponse(simulatedResponse)
  }

  const invoice = useMemo(() => response?.factura ?? null, [response])

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
              <button type="button">Exportar JSON</button>
              <button type="button">Exportar HTML</button>
              <button type="button">Exportar PDF</button>
            </div>
          </div>
          <div className="code-block">
            <pre>{JSON.stringify(response ?? simulatedResponse, null, 2)}</pre>
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
            <div className="invoice-card">
              <div className="invoice-meta">
                <div>
                  <p className="label">Cliente</p>
                  <p className="value">{invoice.cliente}</p>
                </div>
                <div>
                  <p className="label">RUC</p>
                  <p className="value">{invoice.ruc}</p>
                </div>
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
