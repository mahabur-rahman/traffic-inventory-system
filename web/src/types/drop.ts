export type LatestPurchaser = {
  user_id: string;
  username: string;
  qty: number;
  created_at: string;
};

export type Drop = {
  id: string;
  name: string;
  price: number;
  currency: string;
  total_stock: number;
  available_stock: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  created_by: string;
  created_at: string | null;
  activity_feed?: {
    latest_purchasers: LatestPurchaser[];
  };
};

export type DropsListResponse = {
  items: Drop[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};
