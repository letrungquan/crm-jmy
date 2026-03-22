import { Order, CustomerData } from '../types';

export const sendMetaOfflineEvent = async (
  eventName: string,
  order: Order,
  customerData?: CustomerData
) => {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  const accessToken = import.meta.env.VITE_META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta Pixel ID or Access Token is missing in environment variables. Cannot send event.');
    return;
  }

  // Hash function for user data (SHA-256)
  const hashData = async (data: string) => {
    const msgUint8 = new TextEncoder().encode(data.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const userData: any = {};

  if (customerData?.email) {
    userData.em = [await hashData(customerData.email)];
  }
  
  if (order.customerPhone) {
    // Ensure phone number is in correct format (e.g., +84...)
    let phone = order.customerPhone.trim();
    if (phone.startsWith('0')) {
      phone = '84' + phone.substring(1);
    } else if (phone.startsWith('+')) {
      phone = phone.substring(1);
    }
    userData.ph = [await hashData(phone)];
  }

  if (customerData?.fbp) userData.fbp = customerData.fbp;
  if (customerData?.fbc) userData.fbc = customerData.fbc;
  if (customerData?.ip) userData.client_ip_address = customerData.ip;
  if (customerData?.userAgent) userData.client_user_agent = customerData.userAgent;

  const eventData = {
    pixelId: pixelId,
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(new Date(order.createdAt).getTime() / 1000),
        action_source: 'physical_store', // Offline event
        event_id: order.id,
        user_data: userData,
        custom_data: {
          currency: 'VND',
          value: order.revenue,
          order_id: order.id,
          content_name: order.service,
        },
      },
    ],
    access_token: accessToken,
  };

  try {
    const response = await fetch('/api/meta/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Meta API Error:', result);
      throw new Error(result.error?.message || 'Failed to send Meta event');
    }
    console.log('Successfully sent Meta event:', result);
    return result;
  } catch (error) {
    console.error('Error sending Meta offline event:', error);
    throw error;
  }
};
