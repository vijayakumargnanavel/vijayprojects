import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product, Invoice } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading"><div><p class="eyebrow">CHECKOUT</p><h2>Sales & bills</h2><p class="muted">Create a bill and update stock in one operation.</p></div></section>
    <p class="error" *ngIf="error">{{error}}</p><p class="success" *ngIf="message">{{message}}</p>
    <section class="panel"><h3>New sale</h3><form (ngSubmit)="save()">
      <div class="form-grid"><label>Customer name<input name="customerName" [(ngModel)]="customerName" placeholder="Walk-in customer"></label><label>Phone (optional)<input name="customerPhone" [(ngModel)]="customerPhone"></label><label>Payment method<select name="paymentMethod" [(ngModel)]="paymentMethod"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="CREDIT">Credit</option><option value="OTHER">Other</option></select></label><label>Amount paid ₹<input name="amountPaid" type="number" min="0" [(ngModel)]="amountPaid"></label></div>
      <div class="add-line"><label class="grow">Product<select name="selectedProduct" [(ngModel)]="selectedProductId" (ngModelChange)="setDefaultPrice()"><option value="">Choose product</option><option *ngFor="let p of products" [value]="p._id">{{p.sku}} — {{p.name}} (stock {{p.currentStock}})</option></select></label><label>Qty<input name="qty" type="number" min="0.001" step="0.001" [(ngModel)]="qty"></label><label>Unit price ₹<input name="unitPrice" type="number" min="0" step="0.01" [(ngModel)]="unitPrice"></label><button class="btn" type="button" (click)="addLine()">Add item</button></div>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Available</th><th>Qty</th><th>Price</th><th>Amount</th><th></th></tr></thead><tbody><tr *ngFor="let item of items;let i=index"><td>{{item.name}}</td><td>{{item.available}}</td><td>{{item.quantity}}</td><td>{{item.unitPrice | currency:'INR'}}</td><td>{{item.quantity*item.unitPrice | currency:'INR'}}</td><td><button class="link-btn" type="button" (click)="remove(i)">Remove</button></td></tr><tr *ngIf="!items.length"><td colspan="6" class="empty">Add products to the bill.</td></tr></tbody></table></div>
      <div class="totals"><label>Discount ₹<input name="discount" type="number" min="0" [(ngModel)]="discount"></label><div><small>Bill total</small><h2>{{total | currency:'INR':'symbol':'1.2-2'}}</h2></div></div>
      <button class="btn primary" [disabled]="saving||!items.length">{{saving?'Saving…':'Complete sale & print bill'}}</button>
    </form></section>
    <section class="panel"><h3>Recent sales</h3><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th></th></tr></thead><tbody><tr *ngFor="let s of history"><td class="code">{{s.invoiceNumber}}</td><td>{{s.date | date:'medium'}}</td><td>{{s.customerName}}</td><td>{{s.total | currency:'INR'}}</td><td><button class="btn small" (click)="print(s)">Print</button></td></tr></tbody></table></div></section>
  `
})
export class SalesComponent implements OnInit {
  private api=inject(ApiService);
  private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[]; history:Invoice[]=[]; items:SaleLine[]=[];
  selectedProductId=''; qty=1; unitPrice=0; customerName=''; customerPhone=''; paymentMethod='CASH'; amountPaid=0; discount=0; error='';message='';saving=false;
  get subtotal(){return this.items.reduce((s,i)=>s+i.quantity*i.unitPrice,0);}
  get total(){return Math.max(0,Math.round((this.subtotal-this.discount)*100)/100);}
  ngOnInit(){this.refresh();}
  refresh(){
    this.api.products().subscribe({
      next:p=>{this.products=p;this.changeDetector.markForCheck();},
      error:e=>{this.error=e.error?.message||'Could not load products.';this.changeDetector.markForCheck();}
    });
    this.api.sales().subscribe({
      next:s=>{this.history=s;this.changeDetector.markForCheck();},
      error:e=>{this.error=e.error?.message||'Could not load sales history.';this.changeDetector.markForCheck();}
    });
  }
  setDefaultPrice(){const p=this.products.find(x=>x._id===this.selectedProductId);this.unitPrice=p?.sellingPrice??0;}
  addLine(){
    const p=this.products.find(x=>x._id===this.selectedProductId);
    if(!p||this.qty<=0||this.unitPrice<0||!Number.isFinite(this.qty)||!Number.isFinite(this.unitPrice)){this.error='Choose a product and enter valid quantity and price.';return;}
    const existing=this.items.find(i=>i.productId===p._id);
    if(existing){existing.quantity+=Number(this.qty);}else this.items.push({productId:p._id,name:p.name,sku:p.sku,unit:p.unit,available:p.currentStock,quantity:Number(this.qty),unitPrice:Number(this.unitPrice)});
    this.error='';this.selectedProductId='';this.qty=1;this.unitPrice=0;
  }
  remove(i:number){this.items.splice(i,1);}
  save(){
    this.error='';this.message='';
    if(!this.items.length||this.discount<0||this.discount>this.subtotal||this.amountPaid<0||this.amountPaid>this.total){this.error='Check items, discount and amount paid.';return;}
    if(this.items.some(i=>i.quantity>i.available)){this.error='A quantity exceeds displayed stock. Refresh products and try again.';return;}
    this.saving=true;
    this.api.createSale({customerName:this.customerName||'Walk-in customer',customerPhone:this.customerPhone,paymentMethod:this.paymentMethod,amountPaid:this.amountPaid||0,discount:this.discount,items:this.items.map(i=>({productId:i.productId,quantity:i.quantity,unitPrice:i.unitPrice}))})
      .subscribe({
        next:s=>{
          this.message=`Sale ${s.invoiceNumber} saved.`;
          this.items=[];this.discount=0;this.amountPaid=0;this.customerName='';this.customerPhone='';this.saving=false;
          this.changeDetector.markForCheck();
          this.refresh();
          this.print(s);
        },
        error:e=>{
          this.error=e.error?.message||'Sale failed.';
          this.saving=false;
          this.changeDetector.markForCheck();
          this.refresh();
        }
      });
  }
  print(s:Invoice){
    const rows=s.items.map(i=>`<tr><td>${this.escape(i.name||'')}</td><td>${i.quantity} ${this.escape(i.unit||'')}</td><td>₹${Number(i.unitPrice||0).toFixed(2)}</td><td>₹${Number(i.lineTotal||i.quantity*(i.unitPrice||0)).toFixed(2)}</td></tr>`).join('');
    const html=`<!doctype html><html><head><title>${this.escape(s.invoiceNumber)}</title><style>body{font:14px Arial;padding:24px;color:#111}h1{text-align:center}p{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}.total{text-align:right;margin-top:20px}.muted{color:#555}@media print{button{display:none}}</style></head><body><h1>Paint & Hardware Shop</h1><p class="muted">Sales invoice</p><p><b>Invoice:</b> ${this.escape(s.invoiceNumber)} &nbsp; <b>Date:</b> ${new Date(s.date).toLocaleString()}</p><p><b>Customer:</b> ${this.escape(s.customerName||'Walk-in customer')}</p><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><p>Subtotal: ₹${Number(s.subtotal).toFixed(2)}</p><p>Discount: ₹${Number(s.discount).toFixed(2)}</p><h2>Total: ₹${Number(s.total).toFixed(2)}</h2><p>Paid: ₹${Number(s.amountPaid||0).toFixed(2)}</p><p>Payment: ${this.escape(s.paymentMethod||'')}</p></div><p>Thank you for your business!</p><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win=window.open('','_blank','width=850,height=650');
    if(!win){this.error='Sale saved, but the print window was blocked. Allow pop-ups and print from sales history.';this.changeDetector.markForCheck();return;}
    win.document.open();win.document.write(html);win.document.close();
  }
  private escape(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));}
}

interface SaleLine {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  available: number;
  quantity: number;
  unitPrice: number;
}
