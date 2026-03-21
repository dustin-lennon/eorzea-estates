self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Eorzea Estates', {
      body: data.body ?? 'You have a new message.',
      icon: '/images/logo/eorzea-estates-icon.svg',
      badge: '/images/logo/eorzea-estates-icon.svg',
      data: { url: data.url ?? '/messages' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
