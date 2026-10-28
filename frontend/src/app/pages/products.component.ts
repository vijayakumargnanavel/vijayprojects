import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService, Product } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading"><div><p class="eyebrow">CATALOGUE</p><h2>Products & stock</h2><p class="muted">Manage the products sold in your shop.</p></div></section>
    <p class="error" *ngIf="error">{{ error }}</p><p class="success" *ngIf="message">{{ message }}</p>
    <section class="panel">
      <h3>{{editingId ? 'Edit product' : 'Add a product'}}</h3>
      <form class="form-grid" (ngSubmit)="add()">
        <label>SKU / code<input name="sku" [(ngModel)]="form.sku" [readonly]="!!editingId" [required]="!editingId" placeholder="PNT-001"></label>
        <label>Product name<input name="name" [(ngModel)]="form.name" required placeholder="Interior wall paint"></label>
        <label>Category<input name="category" [(ngModel)]="form.category" required placeholder="Paint"></label>
        <label>Brand<input name="brand" [(ngModel)]="form.brand" placeholder="Brand"></label>
        <label>Size / variant<input name="variant" [(ngModel)]="form.variant" placeholder="1 L · White"></label>
        <label>Unit<select name="unit" [(ngModel)]="form.unit"><option *ngFor="let u of units" [value]="u">{{u}}</option></select></label>
        <label>Cost price (₹)<input name="costPrice" type="number" min="0" step="0.01" [(ngModel)]="form.costPrice" required></label>
        <label>Selling price (₹)<input name="sellingPrice" type="number" min="0" step="0.01" [(ngModel)]="form.sellingPrice" required></label>
        <label>Low-stock alert at<input name="reorderLevel" type="number" min="0" step="0.001" [(ngModel)]="form.reorderLevel" required></label>
        <div class="form-actions"><button class="btn primary" [disabled]="saving">{{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product' }}</button><button class="btn" type="button" (click)="reset()">{{editingId ? 'Cancel edit' : 'Clear'}}</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="panel-title"><div><h3>Product list</h3><p class="muted">{{ products.length }} products shown</p></div><div class="search"><input [(ngModel)]="search" placeholder="Search name or SKU"><button class="btn" (click)="load()">Search</button></div></div>
      <div class="table-wrap"><table><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Unit</th><th>Cost</th><th>Selling</th><th>Stock</th><th></th></tr></thead>
      <tbody><tr *ngFor="let p of products"><td class="code">{{p.sku}}</td><td><strong>{{p.name}}</strong><small class="subline">{{p.brand}} {{p.variant}}</small></td><td>{{p.category}}</td><td>{{p.unit}}</td><td>{{p.costPrice | currency:'INR':'symbol':'1.2-2'}}</td><td>{{p.sellingPrice | currency:'INR':'symbol':'1.2-2'}}</td><td><span class="stock-pill" [class.low]="p.currentStock <= p.reorderLevel">{{p.currentStock}}</span></td><td><button class="btn small" type="button" (click)="edit(p)">Edit</button></td></tr>
      <tr *ngIf="!products.length"><td colspan="8" class="empty">No products found. Add your first product above.</td></tr></tbody></table></div>
    </section>
  `
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private changeDetector = inject(ChangeDetectorRef);
  products: Product[] = []; search = ''; error = ''; message = ''; saving = false;
  units = ['piece','can','bucket','box','litre','ml','kg','gram','metre','foot'];
  editingId = '';
  form = this.blank();
  blank() { return { sku:'', name:'', category:'Paint', brand:'', variant:'', unit:'piece', costPrice:0, sellingPrice:0, reorderLevel:5 }; }
  ngOnInit() { this.load(); }
  load() {
    this.api.products(this.search.trim()).subscribe({
      next: products => {
        this.products=products;
        this.error='';
        this.changeDetector.markForCheck();
      },
      error: e => {
        this.error=e.error?.message || 'Could not load products. Check the API.';
        this.changeDetector.markForCheck();
      }
    });
  }
  reset() { this.form = this.blank(); this.editingId=''; }
  edit(product: Product) {
    this.editingId = product._id;
    this.form = {
      sku: product.sku, name: product.name, category: product.category,
      brand: product.brand || '', variant: product.variant || '', unit: product.unit,
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel
    };
    this.error = '';
    this.message = '';
  }
  add() {
    this.error=''; this.message='';
    if ((!this.editingId && !this.form.sku.trim()) || !this.form.name.trim() || !this.form.category.trim()
      || !Number.isFinite(Number(this.form.costPrice)) || Number(this.form.costPrice) < 0
      || !Number.isFinite(Number(this.form.sellingPrice)) || Number(this.form.sellingPrice) < 0
      || !Number.isFinite(Number(this.form.reorderLevel)) || Number(this.form.reorderLevel) < 0) {
      this.error='Enter the required fields and valid prices.';
      return;
    }
    const editing = Boolean(this.editingId);
    const request = editing
      ? this.api.updateProduct(this.editingId, this.form)
      : this.api.createProduct(this.form);
    this.saving=true;
    request.pipe(finalize(() => {
      this.saving=false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: p => {
        this.message = editing ? `Updated ${p.name}.` : `Added ${p.name}. Stock starts at zero; record a purchase to receive stock.`;
        if (!editing) this.search='';
        this.reset();
        this.products = [...this.products.filter(product => product._id !== p._id), p]
          .sort((a, b) => a.name.localeCompare(b.name));
        this.changeDetector.markForCheck();
        this.load();
      },
      error: e => {
        this.error=e.error?.message || (editing ? 'Unable to update product.' : 'Unable to add product.');
        this.changeDetector.markForCheck();
      }
    });
  }
}
