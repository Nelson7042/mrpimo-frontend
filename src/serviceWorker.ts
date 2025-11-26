export function register() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL || ""}/service-worker.js`;
        
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('ServiceWorker registration successful');
            
            // Request notification permission
            if ('Notification' in window) {
              Notification.requestPermission();
            }
            
            // Subscribe to push notifications
            if (registration.pushManager) {
              const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
              
              registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
              })
              .then(subscription => {
                // Send subscription to server
                if (localStorage.getItem('token')) {
                  fetch('http://localhost:5800/api/v1/push/subscribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ subscription })
                  });
                }
              })
              .catch(error => {
                console.error('Error subscribing to push notifications:', error);
              });
            }
          })
          .catch(error => {
            console.error('Error registering service worker:', error);
          });
      });
    }
  }
  
  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  