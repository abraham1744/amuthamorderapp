import * as jose from 'jose';

// Google Sheets configuration with service account
const SHEET_ID = '16s4Z98PeLBJrX4HeydrjTdXpcw5ArV_KJRJpqfw6u6o';
const API_KEY = 'AIzaSyDQPWpuslmxllEt5fDFvz7TOzWPwxkBb2A'; // Verify this key

// Service account credentials (used for write operations)
const SERVICE_ACCOUNT = {
  type: "service_account",
  client_email: "amuthamorderapp@amutham-order-app.iam.gserviceaccount.com",
  project_id: "amutham-order-app",
  private_key_id: "3567fa916b5e002c17adf19e466782ef5467d458",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCsh3pXRT7uOJnB\nuoJ7pf32B7Pv+1r7rJPWTXJqwCz4kXVKkL78+deP52gyi/JIkuaJkyGcQA8sTfS2\nPkrVeT83ukFRKWJ+c1uAtVaHF09INEnMIe4SGADeOPFZ5LksfZ0hwaWGdD5Lu+hm\n1blJz/FNEjHE5URkbdQTz+q025p04/nMI7scIUhAU6Da9/Fr3rYeModej3b91MnO\np0OwoJq33sRZeNV8bAnZa/U3JACvJiHTd4mgEXhtC0b2IJXpHbB+Wz2W6iLZqO31\nDVNc27P5l4koWgic+trWHp7FcDLbFH9P7193frmSTrGhMNajgl2rQq5NC22/cW2j\nRgzGN8uDAgMBAAECggEAENsvrcUbL+UhyJazVudR167K+sBhFEO5Me/hJOLfwe1c\nO0vHDSpP0ER4nq+jnUmU8o4Ic56inN6E8SVG5HJzJbux0/8qG1aj8wBEkvBJE7Hg\nH+yUuPnVY+DGW9UH7nvbVUf5JxjGWVnji+CHuNlzJueHK0iHFRTR6pmewcrO3Wqb\nbBuHZ0zxzafPjZhhrWf2D7Yp9suyVI5zHlAKsTkmHnNGT3vEfzxH8k5td6h2jkqf\nB6wZk1M91jbxKH1W2Kr5n5l5+zPCvQu3PYL/ZOvCU7x++CaBwNqk86UFJFYMh05n\nGgud5p+W2dL05XENSfTd6+m7xyQZlirg1VRToSpO6QKBgQDlm0f212K/NvRDrJ+h\nA05q3btq6W9zb7cJmgVHEVN/XyZwZHFw2QuU7utcLWm5HktoLf/0W99+X9nJ6zya\nTZ4a5RqM8o9s0sum6+UTX9geXXzD0H0uXMxYakZkm+814Hqj7ecJB3DyDeDbCkuI\nDMCGcbxHBGh3lg/E3Eog0TXl9QKBgQDAXI9XkPmA5XwaJ/2V8cD48YiEFy7DDiUe\nz43BjzHyJFQvOVqODwPkj2j6WVVHQXwJZbEbL8WpOy48LPmE8VhkHm0gPhe0b2/q\n1HPRe7+bOjKSTSDxyQWJU5O/cgWxABTIdDIAEY761jLMDvYmXg66xFBSN/gh7jDN\nWhGX21eIlwKBgF++IIQNzF9vyuttUCMT/d8SFtS+AntgWjLmxsybrPWv95dmSueD\nmhDAj+QgC7XlrAwFInYC2W8ZCPfp35t4QjV0011yx9vZCpLQSvWJQdVnpl8A0TJD\n//HeXvwVCeqtcHZq/awGLlLA9sJfyJ8yshVd1+TFMcqsCGdOdJq6on8BAoGAWMSd\n9VfWe6/q5BseP6qvVXIIgIQ+NQ76/Evla7QL5WT0YFKEQlgVgMzZMeY1n0tN1PxT\njWsvONgxjt1mS/4fvxv3WdCtmbtvFxvxUnNbyWNC4RaspEcSwfuKi+cvTy3taU+N\nn1B6/bAJAvfIiY4QGAnt0vM3E1latfjhc4Vp0IMCgYEAtIOGuLudCAxnZ3vPRGDR\nIt0WC8Zvp5zp2IwV7iVmIFYj48sQcKA3fJa8ZOhl84bmPJq9YUC3GGygc8nwMifx\noGxuH0tdHUgYUYAisSGwyrjgtO2SnZ70cTnGNo8Mhs/RSh+lOolWXNqNqVoE+uA2\njENGNFgxY1j0uMbD8y/tD60=\n-----END PRIVATE KEY-----\n",
  client_id: "105769420974008238835",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/amuthamorderapp%40amutham-order-app.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

interface Product {
  name: string;
  price: number;
}

interface Customer {
  name: string;
}

interface Order {
  orderId: string;
  customerName: string;
  invoiceDate: string;
  deliveryDate: string;
  totalQuantity: number;
  totalPrice: number;
  status: string;
  delivered: boolean;
}

interface OrderDetail {
  orderId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderHistory extends Order {
  timestamp: string;
  details: OrderDetail[];
}

class GoogleSheetsService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: SERVICE_ACCOUNT.token_uri,
      exp: now + 3600,
      iat: now
    };

    try {
      const privateKey = await jose.importPKCS8(SERVICE_ACCOUNT.private_key, 'RS256');
      const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .sign(privateKey);
      console.log('Generated JWT:', jwt);

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      const data = await response.json();
      console.log('Token response:', data);
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
        return this.accessToken;
      } else {
        throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${endpoint}`;
      
      const accessToken = await this.getAccessToken();
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // ✅ use access token for all requests
      },
    };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      console.log('Making request:', { url, method, headers: options.headers, body });

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Google Sheets API error:', error);
      throw error;
    }
  }

  // Products Sheet Methods
  async getProducts(): Promise<Product[]> {
    try {
      const response = await this.makeRequest('/values/Products!A:B');
      const rows = response.values || [];
      
      return rows.slice(1).map((row: string[]) => ({
        name: row[0] || '',
        price: parseFloat(row[1]) || 0,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async addProduct(product: Product): Promise<void> {
    const values = [[product.name, product.price]];
    await this.makeRequest('/values/Products!A:B:append?valueInputOption=USER_ENTERED', 'POST', {
      values,
    });
  }

  // Customers Sheet Methods
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await this.makeRequest('/values/Customers!A:A');
      const rows = response.values || [];
      
      return rows.slice(1).map((row: string[]) => ({
        name: row[0] || '',
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async addCustomer(customer: Customer): Promise<void> {
    const values = [[customer.name]];
    await this.makeRequest('/values/Customers!A:A:append?valueInputOption=USER_ENTERED', 'POST', {
      values,
    });
  }

  // Orders Sheet Methods
  async getOrders(): Promise<Order[]> {
    try {
      const response = await this.makeRequest('/values/Orders!A:H');
      const rows = response.values || [];
      
      return rows.slice(1).map((row: string[]) => ({
        orderId: row[0] || '',
        customerName: row[1] || '',
        invoiceDate: row[2] || '',
        deliveryDate: row[3] || '',
        totalQuantity: parseInt(row[4]) || 0,
        totalPrice: parseFloat(row[5]) || 0,
        status: row[6] || 'Pending',
        delivered: row[7] === 'TRUE' || row[7] === 'true',
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async createOrder(order: Order): Promise<void> {
    const values = [[
      order.orderId,
      order.customerName,
      order.invoiceDate,
      order.deliveryDate,
      order.totalQuantity,
      order.totalPrice,
      order.status,
      order.delivered,
    ]];
    
    await this.makeRequest('/values/Orders!A:H:append?valueInputOption=USER_ENTERED', 'POST', {
      values,
    });
  }

  async updateOrderStatus(orderId: string, status: string, delivered: boolean): Promise<void> {
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex !== -1) {
      const rowNumber = orderIndex + 2; // +1 for header, +1 for 0-based index
      
      await this.makeRequest(
        `/values/Orders!G${rowNumber}:H${rowNumber}?valueInputOption=USER_ENTERED`,
        'PUT',
        {
          values: [[status, delivered]],
        }
      );
    }
  }

  // Order Details Sheet Methods
  async getOrderDetails(orderId?: string): Promise<OrderDetail[]> {
    try {
      const response = await this.makeRequest('/values/OrderDetails!A:E');
      const rows = response.values || [];
      
      const details = rows.slice(1).map((row: string[]) => ({
        orderId: row[0] || '',
        productName: row[1] || '',
        quantity: parseInt(row[2]) || 0,
        price: parseFloat(row[3]) || 0,
        subtotal: parseFloat(row[4]) || 0,
      }));

      return orderId ? details.filter(detail => detail.orderId === orderId) : details;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return [];
    }
  }

  async addOrderDetails(details: OrderDetail[]): Promise<void> {
    const values = details.map(detail => [
      detail.orderId,
      detail.productName,
      detail.quantity,
      detail.price,
      detail.subtotal,
    ]);

    await this.makeRequest('/values/OrderDetails!A:E:append?valueInputOption=USER_ENTERED', 'POST', {
      values,
    });
  }

  // Order History Sheet Methods
  async getOrderHistory(): Promise<OrderHistory[]> {
    try {
      const response = await this.makeRequest('/values/OrderHistory!A:I');
      const rows = response.values || [];
      
      const historyOrders = rows.slice(1).map((row: string[]) => ({
        orderId: row[0] || '',
        customerName: row[1] || '',
        invoiceDate: row[2] || '',
        deliveryDate: row[3] || '',
        totalQuantity: parseInt(row[4]) || 0,
        totalPrice: parseFloat(row[5]) || 0,
        status: row[6] || '',
        delivered: row[7] === 'TRUE' || row[7] === 'true',
        timestamp: row[8] || '',
        details: [],
      }));

      for (const order of historyOrders) {
        order.details = await this.getOrderDetails(order.orderId);
      }

      return historyOrders;
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  }

  async archiveOrder(order: Order, details: OrderDetail[]): Promise<void> {
    const timestamp = new Date().toISOString();
    const historyValues = [[
      order.orderId,
      order.customerName,
      order.invoiceDate,
      order.deliveryDate,
      order.totalQuantity,
      order.totalPrice,
      order.status,
      order.delivered,
      timestamp,
    ]];

    await this.makeRequest('/values/OrderHistory!A:I:append?valueInputOption=USER_ENTERED', 'POST', {
      values: historyValues,
    });
  }

  generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }
}

export const googleSheetsService = new GoogleSheetsService();
export type { Product, Customer, Order, OrderDetail, OrderHistory };