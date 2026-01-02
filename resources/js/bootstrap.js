import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.axios.defaults.withCredentials = true;

// Get CSRF token from meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;

    // Add request interceptor to handle CSRF token refresh on 419 errors
    window.axios.interceptors.response.use(
        response => response,
        async error => {
            if (error.response?.status === 419) {
                try {
                    // Refresh CSRF token
                    const response = await axios.get('/csrf-token');
                    const newToken = response.data.token;

                    // Update meta tag
                    const metaTag = document.head.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                        metaTag.content = newToken;
                    }

                    // Update axios header
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;

                    // Retry the original request with new token
                    if (error.config) {
                        error.config.headers['X-CSRF-TOKEN'] = newToken;
                        return window.axios.request(error.config);
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh CSRF token:', refreshError);
                    // Reload page as fallback
                    window.location.reload();
                }
            }
            return Promise.reject(error);
        }
    );
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

window.Pusher = Pusher;

// Disable Pusher debug logging for production
Pusher.logToConsole = false;

// Configure Pusher with error handling
try {
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        encrypted: true,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
        },
    });
    
    // Echo initialized (removed console logs)
} catch (error) {
    console.error('Failed to initialize Echo:', error);
}

// Add global error handling for Pusher connection
window.Echo.connector.pusher.connection.bind('error', function (err) {
    console.error('Pusher connection error:', err);
});

window.Echo.connector.pusher.connection.bind('connected', function() {
    // Connected to Pusher (silent)
});

window.Echo.connector.pusher.connection.bind('disconnected', function() {
    // Disconnected from Pusher (silent)
});

window.Echo.connector.pusher.connection.bind('connecting', function() {
    // Connecting to Pusher (silent)
});

window.Echo.connector.pusher.connection.bind('unavailable', function () {
    console.error('❌ Pusher unavailable');
});

// Define the showSuccessPopup function
function showSuccessPopup(paymentData) {
    // Dispatch a custom event that components can listen for
    const paymentEvent = new CustomEvent('bakong-payment-completed', {
        detail: paymentData
    });
    window.dispatchEvent(paymentEvent);
}

// Set up Echo channels
if (window.Echo) {
    // Bakong payments channel
    window.Echo.channel('bakong-payments')
        .listen('.bakong.payment.completed', (data) => {
            // Dispatch browser event for React to listen
            window.dispatchEvent(new CustomEvent('bakong-payment-completed', { detail: data }));
        });

    // Product stock updates channel
    window.Echo.channel('products')
        .listen('.stock.updated', (e) => {
            // Dispatch a custom event for React components to listen
            const stockEvent = new CustomEvent('product-stock-updated', {
                detail: {
                    productId: e.productId,
                    newStock: e.newStock,
                }
            });
            window.dispatchEvent(stockEvent);
        });
}
