import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  _id: string; sku: string; name: string; category: string;
  brand?: string; variant?: string; unit: string;
  costPrice: number; sellingPrice: number; currentStock: number;
  reorderLevel: number; active: boolean;
}
export interface Supplier {
  _id: string; name: string; phone?: string; address?: string; notes?: string;
}
export interface InvoiceItem {
  productId: string; sku?: string; name?: string; unit?: string;
  quantity: number; unitCost?: number; unitPrice?: number; lineTotal?: number;
}
export interface Invoice {
  _id: string; invoiceNumber: string; date: string; total: number;
  subtotal: number; discount: number; items: InvoiceItem[];
  supplierName?: string; customerName?: string; paymentMethod?: string;
  amountPaid?: number;
}
export interface PurchaseRequest {
  supplierId?: string;
  supplierName?: string;
  supplierInvoiceNumber?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
  discount: number;
  amountPaid: number;
}
export interface SaleRequest {
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  amountPaid: number;
  discount: number;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}
export interface StockMovement {
  _id: string;
  productId: { sku?: string; name?: string; unit?: string };
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  before: number;
  after: number;
  reason: string;
  createdAt: string;
}
export interface DashboardReport {
  productCount: number;
  lowStockCount: number;
  salesTotal: number;
  purchaseTotal: number;
  stockValue: number;
  grossProfitEstimate: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  // private base = 'http://localhost:3000/api';
  private base = 'https://paint-shop-inventory-api.onrender.com/api';

  health(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(`${this.base}/health`);
  }
  products(search = '', lowStock = false): Observable<Product[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (lowStock) params['lowStock'] = 'true';
    return this.http.get<Product[]>(`${this.base}/products`, { params });
  }
  createProduct(body: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, body);
  }
  updateProduct(id: string, body: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${id}`, body);
  }
  suppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.base}/suppliers`);
  }
  createSupplier(body: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.base}/suppliers`, body);
  }
  purchases(): Observable<Invoice[]> { return this.http.get<Invoice[]>(`${this.base}/purchases`); }
  createPurchase(body: PurchaseRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/purchases`, body, { headers: this.idempotencyHeaders() });
  }
  sales(): Observable<Invoice[]> { return this.http.get<Invoice[]>(`${this.base}/sales`); }
  createSale(body: SaleRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/sales`, body, { headers: this.idempotencyHeaders() });
  }
  stock(lowStock = false): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/inventory/stock`, { params: lowStock ? { lowStock: 'true' } : {} });
  }
  movements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.base}/inventory/movements`);
  }
  adjustStock(body: { productId: string; quantity: number; reason: string }): Observable<Product> {
    return this.http.post<Product>(`${this.base}/inventory/adjustments`, body);
  }
  dashboard(): Observable<DashboardReport> {
    return this.http.get<DashboardReport>(`${this.base}/reports/dashboard`);
  }

  private idempotencyHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}
