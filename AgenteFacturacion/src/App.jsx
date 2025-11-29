import { useCallback, useEffect, useState } from 'react'
import './App.css'

function App() {
  const [promptText, setPromptText] = useState('')
  const [requestPayload, setRequestPayload] = useState(null)
  const [responseData, setResponseData] = useState(null)

  const enviarPrompt = () => {
    const payload = { prompt: promptText }
    setRequestPayload(payload)
    // TODO: enviar este JSON al backend Java (endpoint pendiente)
  }

  const recibirRespuesta = useCallback((json) => {
    setResponseData(json)
  }, [])

  useEffect(() => {
    window.recibirRespuesta = recibirRespuesta
    return () => delete window.recibirRespuesta
  }, [recibirRespuesta])

  const factura = responseData?.factura
  const items = factura?.items || []
  const subtotal = factura?.neto ?? factura?.subtotal

  return (
    <main className="layout">
      <header className="page-header">
        <div>
          <p className="eyebrow">Integración pendiente</p>
          <h1>Agente de Facturación</h1>
          <p className="lede">
            El frontend arma el JSON de solicitud y espera la respuesta del backend Java.
          </p>
        </div>
      </header>

      <section className="prompt-panel">
        <div className="field">
          <label htmlFor="prompt">Prompt del usuario</label>
          <textarea
            id="prompt"
            rows="4"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Escribe aquí el prompt para generar la factura"
          />
        </div>
        <div className="actions">
          <button type="button" onClick={enviarPrompt}>
            Enviar
          </button>
        </div>
      </section>

      <section className="status-grid">
        <div className="card">
          <div className="card-header">
            <h2>JSON de solicitud</h2>
            <span className="status waiting">A la espera del backend</span>
          </div>
          <pre className="code-block">
            {requestPayload ? JSON.stringify(requestPayload, null, 2) : 'Sin solicitudes aún.'}
          </pre>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Respuesta del backend</h2>
            <span className="status waiting">Endpoint pendiente</span>
          </div>
          <pre className="code-block">
            {responseData ? JSON.stringify(responseData, null, 2) : 'A la espera del backend...'}
          </pre>
        </div>
      </section>

      <section className="card invoice-card">
        <div className="card-header">
          <h2>Vista previa de factura</h2>
          <span className="status waiting">Se poblará con la respuesta</span>
        </div>
        {factura ? (
          <div className="invoice-body">
            <div className="invoice-meta">
              <div>
                <p className="label">Cliente</p>
                <p className="value">{factura.cliente}</p>
              </div>
              <div>
                <p className="label">RUC</p>
                <p className="value">{factura.ruc}</p>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="numeric">Cantidad</th>
                  <th className="numeric">Precio</th>
                  <th className="numeric">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.descripcion}-${index}`}>
                    <td>{item.descripcion}</td>
                    <td className="numeric">{item.cantidad}</td>
                    <td className="numeric">{item.precio}</td>
                    <td className="numeric">{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span className="numeric">{subtotal ?? '-'}</span>
              </div>
              <div className="total-row">
                <span>IGV</span>
                <span className="numeric">{factura.igv ?? '-'}</span>
              </div>
              <div className="total-row total-amount">
                <span>Total</span>
                <span className="numeric">{factura.total ?? '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="placeholder">La vista previa se mostrará cuando llegue la respuesta del backend.</p>
        )}
      </section>
    </main>
  )
}

export default App
