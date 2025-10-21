// types/orders.ts

export interface OrderItem {
    quantity: number;
    price_at_purchase: number;
    book_title: string;
  }
  
  export interface Order {
    id: string;
    order_number: string;
    status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
    total_amount: number;
    created_at: string;
    shipping_address: {
      name: string;
      line1: string;
      city: string;
      state: string;
      postal_code: string;
    };
    items: OrderItem[];
    tracking_number?: string;
    user_name?: string; // Optional for user-facing screens
    user_email?: string; // Optional for user-facing screens
  }