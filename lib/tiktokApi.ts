import { Order, CustomerData } from '../types';

// Function to hash data using SHA-256 as required by TikTok
const hashData = async (data: string): Promise<string> => {
    if (!data) return '';
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const sendTikTokOfflineEvent = async (
    eventName: string,
    order: Order,
    customerData?: CustomerData
) => {
    const pixelId = import.meta.env.VITE_TIKTOK_PIXEL_ID;
    const accessToken = import.meta.env.VITE_TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
        throw new Error('Missing TikTok Pixel ID or Access Token');
    }

    // Format phone number (remove leading zero, add country code if needed, but TikTok prefers E.164 format or just hashed)
    // Assuming Vietnamese numbers, if starts with 0, replace with +84
    let formattedPhone = order.customerPhone || '';
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
    }

    const hashedPhone = await hashData(formattedPhone);
    const hashedEmail = customerData?.email ? await hashData(customerData.email) : undefined;

    const eventData = {
        event_source: "offline",
        event_source_id: pixelId, // This is actually the Offline Event Set ID
        data: [
            {
                event_id: order.id,
                event: eventName, // e.g., 'CompletePayment' or 'PlaceAnOrder'
                event_time: Math.floor(new Date(order.createdAt).getTime() / 1000),
                user: {
                    phone_number: hashedPhone ? [hashedPhone] : undefined,
                    email: hashedEmail ? [hashedEmail] : undefined,
                    // Include ttp and ttclid if available
                    ttp: customerData?.ttp,
                    ttclid: customerData?.ttclid,
                },
                properties: {
                    currency: 'VND',
                    value: order.revenue,
                    contents: [
                        {
                            price: order.revenue,
                            quantity: 1,
                            content_name: order.service || 'Offline Purchase',
                            content_id: order.id,
                        }
                    ]
                }
            }
        ]
    };

    try {
        const response = await fetch('/api/tiktok/event', {
            method: 'POST',
            headers: {
                'Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        const result = await response.json();

        if (!response.ok || result.code !== 0) {
            console.error('TikTok API Error Response:', result);
            throw new Error(result.message || 'Failed to send TikTok event');
        }

        return result;
    } catch (error) {
        console.error('Error sending TikTok offline event:', error);
        throw error;
    }
};
