const mung = require('express-mung')
const bodyParser = require('body-parser')
const opentelemetry = require('@opentelemetry/core')
const { NodeTracer } = require('@opentelemetry/node')
const { initGlobalTracer } = require('@opentelemetry/core')
const { SimpleSpanProcessor } = require('@opentelemetry/tracing')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')

const tracer = new NodeTracer({
  plugins: {
      http: {
        enabled: true,
        path: '@opentelemetry/plugin-http'
      }
  }
})

const exporter = new JaegerExporter({
  serviceName: 'service-2',
  host: 'localhost'
})

tracer.addSpanProcessor(new SimpleSpanProcessor(exporter))

initGlobalTracer(tracer)

const axios = require('axios')
const express = require('express')

const app = express()

app.use(bodyParser.json())

app.use(mung.json((body, req, res) => {
  const tracer = opentelemetry.getTracer()
  const span = tracer.getCurrentSpan()

  if (!span) return

  const { traceId } = span.context()

  span.addEvent('', { request: JSON.stringify({ body: req.body }, null, 4) })
  span.addEvent('', { response: JSON.stringify({ body }, null, 4) })

  res.append('Jaeger-Trace-Id', traceId)
}))

app.post('/posts', async (req, res) => {
  const post = req.body

  const response = await axios.post('https://jsonplaceholder.typicode.com/posts', post)

  res.status(response.status)
    .json(response.data)
})

app.listen(3001, () => { console.log('Service 2 ouvindo na porta 3001') })