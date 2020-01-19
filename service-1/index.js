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
  serviceName: 'service-1',
  host: 'localhost'
})

tracer.addSpanProcessor(new SimpleSpanProcessor(exporter))

initGlobalTracer(tracer)

const axios = require('axios')
const express = require('express')

const SERVICE_2_URL = 'http://localhost:3001'

const service2 = axios.create({ baseURL: SERVICE_2_URL })

const app = express()

app.post('/posts', async (req, res) => {
  const payload = req.body

  const response = await service2.post('/posts', payload)

  res.status(response.status)
    .json(response.data)
})

app.listen(3000, () => { console.log('Service 1 ouvindo na porta 3000') })