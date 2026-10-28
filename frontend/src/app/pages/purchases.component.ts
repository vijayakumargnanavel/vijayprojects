import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product, Supplier, Invoice } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading"><div><p class="eyebrow">STOCK IN</p><h2>Purchases</h2><p class="muted">Record stock received from suppliers.</p></div></section>
    <p class="error" *ngIf="error">{{error}}</p><p class="success" *ngIf="message">{{message}}</p>
    <section class="panel"><h3>New purchase</h3>
      <form (ngSubmit)="save()">
        <div class="form-grid">
          <label>Supplier<select name="supplierId" [(ngModel)]="supplierId"><option value="">Select supplier (optional)</option><option *ngFor="let s of suppliers" [value]="s._id">{{s.name}}</option></select></label>
          <label>Supplier invoice number<input name="supplierInvoiceNumber" [(ngModel)]="supplierInvoiceNumber"></label>
          <label>New supplier name (optional)<input name="supplierName" [(ngModel)]="supplierName" placeholder="If not in list"></label>
          <label>Amount paid (₹)<input name="amountPaid" type="number" min="0" [(ngModel)]="amountPaid"></label>
        </div>
        <div class="add-line"><label class="grow">Product<select name="selectedProduct" [(ngModel)]="selectedProductId"><option value="">Choose product</option><option *ngFor="let p of products" [value]="p._id">{{p.sku}} — {{p.name}} ({{p.currentStock}} {{p.unit}})</option></select></label><label>Quantity<input name="qty" type="number" min="0.001" step="0.001" [(ngModel)]="qty"></label><label>Unit cost ₹<input name="unitCost" type="number" min="0" step="0.01" [(ngModel)]="unitCost"></label><button class="btn" type="button" (click)="addLine()">Add item</button></div>
        <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit cost</th><th>Amount</th><th></th></tr></thead><tbody><tr *ngFor="let item of items; let i=index"><td>{{item.name}}</td><td>{{item.quantity}} {{item.unit}}</td><td>{{item.unitCost | currency:'INR'}}</td><td>{{item.quantity * item.unitCost | currency:'INR'}}</td><td><button class="link-btn" type="button" (click)="remove(i)">Remove</button></td></tr><tr *ngIf="!items.length"><td colspan="5" class="empty">Add products to this purchase.</td></tr></tbody></table></div>
        <div class="totals"><label>Discount ₹<input name="discount" type="number" min="0" [(ngModel)]="discount"></label><div><small>Purchase total</small><h2>{{total | currency:'INR':'symbol':'1.2-2'}}</h2></div></div>
        <button class="btn primary" [disabled]="saving || !items.length">{{saving?'Saving…':'Save purchase & update stock'}}</button>
      </form>
    </section>
    <section class="panel"><h3>Recent purchases</h3><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th></tr></thead><tbody><tr *ngFor="let p of history"><td class="code">{{p.invoiceNumber}}</td><td>{{p.date | date:'mediumDate'}}</td><td>{{p.supplierName || '—'}}</td><td>{{p.items.length}}</td><td>{{p.total | currency:'INR'}}</td></tr></tbody></table></div></section>
    <section class="panel"><h3>Suppliers</h3>
      <form class="form-grid" (ngSubmit)="addSupplier()">
        <label>Name<input name="newSupplierName" [(ngModel)]="newSupplier.name" required></label>
        <label>Phone<input name="newSupplierPhone" [(ngModel)]="newSupplier.phone"></label>
        <label>Address<input name="newSupplierAddress" [(ngModel)]="newSupplier.address"></label>
        <div class="form-actions"><button class="btn primary" [disabled]="savingSupplier">{{savingSupplier?'Saving…':'Add supplier'}}</button></div>
      </form>
      <div class="table-wrap" *ngIf="suppliers.length"><table><thead><tr><th>Name</th><th>Phone</th><th>Address</th></tr></thead><tbody><tr *ngFor="let s of suppliers"><td>{{s.name}}</td><td>{{s.phone || '—'}}</td><td>{{s.address || '—'}}</td></tr></tbody></table></div>
      <p class="empty" *ngIf="!suppliers.length">No suppliers yet. Add a supplier to select it on future purchases.</p>
    </section>
  `
})
export class PurchasesComponent implements OnInit {
  private api=inject(ApiService);
  private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[]; suppliers:Supplier[]=[]; history:Invoice[]=[]; items:PurchaseLine[]=[];
  newSupplier={name:'',phone:'',address:''}; savingSupplier=false;
  supplierId=''; supplierName=''; supplierInvoiceNumber=''; selectedProductId=''; qty=1; unitCost=0; discount=0; amountPaid=0;
  error=''; message=''; saving=false;
  get subtotal(){return this.items.reduce((s,i)=>s+i.quantity*i.unitCost,0);}
  get total(){return Math.max(0,Math.round((this.subtotal-this.discount)*100)/100);}
  ngOnInit(){this.refresh(); this.loadSuppliers();}
  refresh(){
    this.api.products().subscribe({
      next:p=>{this.products=p;this.changeDetector.markForCheck();},
      error:e=>{this.error=e.error?.message||'Could not load products.';this.changeDetector.markForCheck();}
    });
    this.api.purchases().subscribe({
      next:p=>{this.history=p;this.changeDetector.markForCheck();},
      error:e=>{this.error=e.error?.message||'Could not load purchase history.';this.changeDetector.markForCheck();}
    });
  }
  loadSuppliers(){
    this.api.suppliers().subscribe({
      next:s=>{this.suppliers=s;this.changeDetector.markForCheck();},
      error:e=>{this.error=e.error?.message||'Could not load suppliers.';this.changeDetector.markForCheck();}
    });
  }
  addSupplier(){
    this.error='';this.message='';
    if(!this.newSupplier.name.trim()){this.error='Enter a supplier name.';return;}
    this.savingSupplier=true;
    this.api.createSupplier(this.newSupplier).subscribe({
      next:s=>{
        this.suppliers=[...this.suppliers,s].sort((a,b)=>a.name.localeCompare(b.name));
        this.supplierId=s._id;
        this.newSupplier={name:'',phone:'',address:''};
        this.message=`Supplier ${s.name} added.`;
        this.savingSupplier=false;
        this.changeDetector.markForCheck();
      },
      error:e=>{this.error=e.error?.message||'Unable to add supplier.';this.savingSupplier=false;this.changeDetector.markForCheck();}
    });
  }
  addLine(){
    const p=this.products.find(x=>x._id===this.selectedProductId);
    if(!p||!Number.isFinite(this.qty)||this.qty<=0||!Number.isFinite(this.unitCost)||this.unitCost<0){this.error='Choose a product and enter a valid quantity and cost.';return;}
    this.items.push({productId:p._id,name:p.name,sku:p.sku,unit:p.unit,quantity:Number(this.qty),unitCost:Number(this.unitCost)});
    this.error=''; this.selectedProductId=''; this.qty=1; this.unitCost=0;
  }
  remove(i:number){this.items.splice(i,1);}
  save(){
    this.error='';this.message='';
    if(!this.items.length||this.discount<0||this.discount>this.subtotal||this.amountPaid<0||this.amountPaid>this.total){this.error='Check items, discount and amount paid.';return;}
    this.saving=true;
    this.api.createPurchase({supplierId:this.supplierId||undefined,supplierName:this.supplierName,supplierInvoiceNumber:this.supplierInvoiceNumber,items:this.items,discount:this.discount,amountPaid:this.amountPaid||0})
      .subscribe({
        next:p=>{
          this.message=`Purchase ${p.invoiceNumber} saved. Stock updated.`;
          this.items=[];this.discount=0;this.amountPaid=0;this.saving=false;
          this.changeDetector.markForCheck();
          this.refresh();
        },
        error:e=>{this.error=e.error?.message||'Purchase failed.';this.saving=false;this.changeDetector.markForCheck();}
      });
  }
}

interface PurchaseLine {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unitCost: number;
}
