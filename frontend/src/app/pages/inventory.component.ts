import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product, StockMovement } from '../core/api.service';

@Component({
  standalone:true,imports:[CommonModule,FormsModule],
  template:`
    <section class="page-heading"><div><p class="eyebrow">INVENTORY</p><h2>Stock & movements</h2><p class="muted">Current balances and a record of stock changes.</p></div></section>
    <p class="error" *ngIf="error">{{error}}</p>
    <p class="success" *ngIf="message">{{message}}</p>
    <section class="panel"><h3>Manual stock adjustment</h3><p class="muted">Use a positive quantity to add stock or a negative quantity to remove it.</p>
      <form class="form-grid" (ngSubmit)="adjust()">
        <label>Product<select name="adjustProduct" [(ngModel)]="adjustment.productId" required><option value="">Choose product</option><option *ngFor="let p of adjustmentProducts" [value]="p._id">{{p.sku}} — {{p.name}} ({{p.currentStock}} {{p.unit}})</option></select></label>
        <label>Quantity change<input name="adjustQuantity" type="number" step="0.001" [(ngModel)]="adjustment.quantity" required></label>
        <label>Reason<input name="adjustReason" [(ngModel)]="adjustment.reason" required placeholder="Stock count correction"></label>
        <div class="form-actions"><button class="btn primary" [disabled]="adjusting">{{adjusting?'Saving…':'Save adjustment'}}</button></div>
      </form>
    </section>
    <section class="panel"><div class="panel-title"><div><h3>Current stock</h3><p class="muted">Products at or below their reorder level are highlighted.</p></div><label class="check"><input type="checkbox" [(ngModel)]="lowOnly" (change)="loadStock()"> Low stock only</label></div>
    <div class="table-wrap"><table><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Stock</th><th>Reorder at</th><th>Cost value</th></tr></thead><tbody><tr *ngFor="let p of products"><td class="code">{{p.sku}}</td><td>{{p.name}}</td><td>{{p.category}}</td><td><span class="stock-pill" [class.low]="p.currentStock<=p.reorderLevel">{{p.currentStock}} {{p.unit}}</span></td><td>{{p.reorderLevel}}</td><td>{{p.currentStock*p.costPrice|currency:'INR'}}</td></tr><tr *ngIf="!products.length"><td colspan="6" class="empty">No stock records.</td></tr></tbody></table></div></section>
    <section class="panel"><div class="panel-title"><div><h3>Stock movement history</h3><p class="muted">Purchases, sales and manual adjustments.</p></div><button class="btn" (click)="loadMovements()">Refresh</button></div>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Change</th><th>Before</th><th>After</th><th>Reason</th></tr></thead><tbody><tr *ngFor="let m of movements"><td>{{m.createdAt|date:'short'}}</td><td>{{m.productId.name||'—'}}</td><td>{{m.type}}</td><td [class.positive]="m.quantity>0" [class.negative]="m.quantity<0">{{m.quantity>0?'+':''}}{{m.quantity}}</td><td>{{m.before}}</td><td>{{m.after}}</td><td>{{m.reason}}</td></tr><tr *ngIf="!movements.length"><td colspan="7" class="empty">No movements yet. Purchases and sales will appear here.</td></tr></tbody></table></div></section>
  `
})
export class InventoryComponent implements OnInit {
  private api=inject(ApiService);private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[];adjustmentProducts:Product[]=[];movements:StockMovement[]=[];lowOnly=false;error='';message='';adjusting=false;
  adjustment={productId:'',quantity:0,reason:''};
  ngOnInit(){this.loadStock();this.loadAdjustmentProducts();this.loadMovements();}
  loadStock(){this.api.stock(this.lowOnly).subscribe({
    next:p=>{this.products=p;this.error='';this.changeDetector.markForCheck();},
    error:e=>{this.error=e.error?.message||'Could not load stock.';this.changeDetector.markForCheck();}
  });}
  loadAdjustmentProducts(){this.api.stock().subscribe({
    next:p=>{this.adjustmentProducts=p;this.changeDetector.markForCheck();},
    error:e=>{this.error=e.error?.message||'Could not load products for stock adjustment.';this.changeDetector.markForCheck();}
  });}
  loadMovements(){this.api.movements().subscribe({
    next:m=>{this.movements=m;this.changeDetector.markForCheck();},
    error:e=>{this.error=e.error?.message||'Could not load stock movements.';this.changeDetector.markForCheck();}
  });}
  adjust(){
    this.error='';this.message='';
    if(!this.adjustment.productId||!Number.isFinite(Number(this.adjustment.quantity))||Number(this.adjustment.quantity)===0||!this.adjustment.reason.trim()){
      this.error='Choose a product, enter a non-zero quantity and provide a reason.';
      return;
    }
    this.adjusting=true;
    this.api.adjustStock({...this.adjustment,quantity:Number(this.adjustment.quantity)}).subscribe({
      next:p=>{
        this.message=`Stock adjusted for ${p.name}.`;
        this.adjustment={productId:'',quantity:0,reason:''};
        this.adjusting=false;
        this.changeDetector.markForCheck();
        this.loadStock();
        this.loadAdjustmentProducts();
        this.loadMovements();
      },
      error:e=>{this.error=e.error?.message||'Unable to adjust stock.';this.adjusting=false;this.changeDetector.markForCheck();}
    });
  }
}
