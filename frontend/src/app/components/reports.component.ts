import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService, Invoice, Product } from '../core/api.service';

interface ReportRow {
  date?: string;
  type: 'PRODUCT' | 'PURCHASE' | 'SALE';
  reference: string;
  party: string;
  details: string;
  quantity: number;
  amount: number;
  stock: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private changeDetector = inject(ChangeDetectorRef);

  rows: ReportRow[] = [];
  search = '';
  type = 'ALL';
  pageSize = 10;
  page = 1;
  loading = true;
  error = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    forkJoin({
      products: this.api.products(),
      purchases: this.api.purchases(),
      sales: this.api.sales()
    }).subscribe({
      next: ({ products, purchases, sales }) => {
        this.rows = [
          ...this.productRows(products),
          ...this.purchaseRows(purchases),
          ...this.saleRows(sales)
        ].sort((a, b) => this.rowTime(b) - this.rowTime(a));
        this.loading = false;
        this.page = 1;
        this.changeDetector.markForCheck();
      },
      error: e => {
        this.error = e.error?.message || 'Could not load report data.';
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  get filteredRows() {
    const search = this.search.trim().toLowerCase();
    return this.rows.filter(row => {
      const typeMatches = this.type === 'ALL' || row.type === this.type;
      const searchable = [row.reference, row.party, row.details, row.type, row.stock, row.quantity, row.amount]
        .join(' ').toLowerCase();
      return typeMatches && (!search || searchable.includes(search));
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize)); }

  get pagedRows() {
    if (this.page > this.totalPages) this.page = this.totalPages;
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.page = 1; }

  previousPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  private productRows(products: Product[]): ReportRow[] {
    return products.map(product => ({
      type: 'PRODUCT',
      reference: product.sku,
      party: product.brand || '—',
      details: `${product.name}${product.variant ? ' · ' + product.variant : ''}`,
      quantity: product.currentStock,
      amount: product.sellingPrice,
      stock: product.currentStock
    }));
  }

  private purchaseRows(purchases: Invoice[]): ReportRow[] {
    return purchases.map(purchase => ({
      date: purchase.date,
      type: 'PURCHASE',
      reference: purchase.invoiceNumber,
      party: purchase.supplierName || '—',
      details: this.itemSummary(purchase),
      quantity: this.itemQuantity(purchase),
      amount: purchase.total,
      stock: 0
    }));
  }

  private saleRows(sales: Invoice[]): ReportRow[] {
    return sales.map(sale => ({
      date: sale.date,
      type: 'SALE',
      reference: sale.invoiceNumber,
      party: sale.customerName || 'Walk-in customer',
      details: this.itemSummary(sale),
      quantity: this.itemQuantity(sale),
      amount: sale.total,
      stock: 0
    }));
  }

  private itemSummary(invoice: Invoice) {
    return invoice.items.map(item => `${item.name || item.sku || 'Product'} × ${item.quantity}`).join(', ') || '—';
  }

  private itemQuantity(invoice: Invoice) {
    return invoice.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  private rowTime(row: ReportRow) {
    return row.date ? new Date(row.date).getTime() : 0;
  }
}
