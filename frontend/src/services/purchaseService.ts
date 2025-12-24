import api from "@/lib/api";

export interface Purchase {
  id: number;
  purchaseDate: string;
  supplier: string;
  invoiceNumber?: string;
  totalAmount?: number;
  remarks?: string;
  office: {
    id: number;
    name: string;
  };
  purchasedBy: {
    id: number;
    username: string;
    name?: string;
  };
  items: Array<{
    item: {
      id: number;
      name: string;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface PurchaseForm {
  purchaseDate: string;
  supplier: string;
  invoiceNumber?: string;
  totalAmount?: number;
  remarks?: string;
  items: Array<{
    itemId: number;
    quantity: number;
    unitPrice: number;
  }>;
}

// Create a new purchase
export const createPurchase = async (purchase: PurchaseForm): Promise<Purchase> => {
  const response = await api.post("/purchases", purchase);
  return response.data;
};

// Get all purchases for current user's office
export const getPurchases = async (): Promise<Purchase[]> => {
  const response = await api.get("/purchases");
  return response.data;
};

// Get purchase by ID
export const getPurchaseById = async (id: number): Promise<Purchase> => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

// Get purchases by office
export const getPurchasesByOffice = async (officeId: number): Promise<Purchase[]> => {
  const response = await api.get(`/purchases/office/${officeId}`);
  return response.data;
};
