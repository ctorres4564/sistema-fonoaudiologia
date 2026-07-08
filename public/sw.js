const CACHE_NAME = 'fonoflow-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Instalar Service Worker e salvar assets básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// Ativar e remover caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Responder requisições (estatégia Network First para evitar cachear dados em tempo real do Firebase)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições do Firebase/Firestore/Auth e da API do OpenRouter
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('openrouter.ai') ||
    event.request.url.includes('/api/gemini')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})
