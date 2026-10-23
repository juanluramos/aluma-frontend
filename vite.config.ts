import react from '@vitejs/plugin-react'
import type { ClientRequest, IncomingMessage } from 'node:http'
import { defineConfig, type ProxyOptions } from 'vite'

const ORIGEN_LOCAL = 'http://localhost:5173'

function esRedLocal(hostname: string) {
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true
  const partes = hostname.split('.').map(Number)
  return partes.length === 4 && partes[0] === 172 && partes[1] >= 16 && partes[1] <= 31
}

function reescribirOrigen(proxyReq: ClientRequest, req: IncomingMessage) {
  const origen = req.headers.origin
  if (typeof origen !== 'string') return
  try {
    const url = new URL(origen)
    const puertoVite = url.port === '5173' || url.port === '5174'
    if (url.protocol === 'http:' && puertoVite && esRedLocal(url.hostname)) {
      proxyReq.setHeader('origin', ORIGEN_LOCAL)
    }
  } catch {
    // Un origen que no es una URL lo sigue rechazando la API.
  }
}

function proxyApi(ws = false): ProxyOptions {
  return {
    target: 'http://localhost:3000',
    ws,
    configure: (proxy) => {
      proxy.on('proxyReq', reescribirOrigen)
      proxy.on('proxyReqWs', reescribirOrigen)
    },
  }
}

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    proxy: {
      '/api': proxyApi(),
      '/socket.io': proxyApi(true),
    },
  },
})
