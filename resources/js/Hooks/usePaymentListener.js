import React, { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

// Real-time payment listener using Pusher only (no polling)
export function usePaymentListener(md5Hash, onPaymentDetected) {
    const [isPaymentDetected, setIsPaymentDetected] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    // Set up Pusher listener for payment events
    useEffect(() => {
        if (!md5Hash) {
            return;
        }
        
        
        let pusher = null;
        let channel = null;

        const setupPusher = () => {
            try {
                // Reset states
                setIsPaymentDetected(false);
                setConnectionError(false);

                // Initialize Pusher with your app key and cluster
                pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY || window.Echo?.options?.key || '12345', {
                    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || window.Echo?.options?.cluster || 'ap1',
                    encrypted: true,
                    forceTLS: true
                });

                // Connection event handlers
                pusher.connection.bind('connected', () => {
                    setConnectionError(false);
                });

                pusher.connection.bind('error', (error) => {
                    
                    setConnectionError(true);
                });

                pusher.connection.bind('disconnected', () => {
                    setConnectionError(true);
                });

                // Subscribe to the payment channel
                channel = pusher.subscribe('khqr-payments');


                // Listen for payment completed events
                channel.bind('khqr.payment.completed', (data) => {
                    
                    // Check if this event is for our QR code
                    if (data.md5 === md5Hash) {
                        setIsPaymentDetected(true);
                        
                        if (onPaymentDetected && typeof onPaymentDetected === 'function') {
                            data.status = 'PAID'; // Ensure consistent status
                            onPaymentDetected(data);
                        }
                    }
                });
                
                
            } catch (error) {
                
                setConnectionError(true);
            }
        };
        
        setupPusher();
        
        // Clean up Pusher connection when component unmounts or md5Hash changes
        return () => {
            if (channel) {
                channel.unbind_all();
                if (pusher) {
                    pusher.unsubscribe('khqr-payments');
                }
            }
            if (pusher) {
                pusher.disconnect();
            }
        };
    }, [md5Hash, onPaymentDetected]);

    return { isPaymentDetected, connectionError };
}
