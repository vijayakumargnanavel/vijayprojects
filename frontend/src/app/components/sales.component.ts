import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Product, Invoice } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales.component.html',
  
})
export class SalesComponent implements OnInit {
  private api=inject(ApiService);
  private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[]; history:Invoice[]=[]; items:SaleLine[]=[];
  saleForm = new FormGroup({
    customerName: new FormControl('', { nonNullable: true }),
    customerPhone: new FormControl('', { nonNullable: true }),
    paymentMethod: new FormControl('CASH', { nonNullable: true }),
    amountPaid: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    discount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] })
  });
  lineForm = new FormGroup({
    selectedProductId: new FormControl('', { nonNullable: true }),
    qty: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    unitPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });
  error='';message='';saving=false;
  get subtotal(){return this.items.reduce((s,i)=>s+i.quantity*i.unitPrice,0);}
  get total(){return Math.max(0,Math.round((this.subtotal-this.saleForm.controls.discount.value)*100)/100);}
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
  setDefaultPrice(){const line=this.lineForm.getRawValue();const p=this.products.find(x=>x._id===line.selectedProductId);this.lineForm.patchValue({unitPrice:p?.sellingPrice??0});}
  addLine(){
    const line=this.lineForm.getRawValue();
    const p=this.products.find(x=>x._id===line.selectedProductId);
    if(!p||line.qty<=0||line.unitPrice<0||!Number.isFinite(line.qty)||!Number.isFinite(line.unitPrice)){this.error='Choose a product and enter valid quantity and price.';return;}
    const existing=this.items.find(i=>i.productId===p._id);
    if(existing){existing.quantity+=Number(line.qty);}else this.items.push({productId:p._id,name:p.name,sku:p.sku,unit:p.unit,available:p.currentStock,quantity:Number(line.qty),unitPrice:Number(line.unitPrice)});
    this.error='';this.lineForm.reset({selectedProductId:'',qty:1,unitPrice:0});
  }
  remove(i:number){this.items.splice(i,1);}
  save(){
    this.error='';this.message='';
    const sale=this.saleForm.getRawValue();
    if(!this.items.length||sale.discount<0||sale.discount>this.subtotal||sale.amountPaid<0||sale.amountPaid>this.total){this.error='Check items, discount and amount paid.';return;}
    if(this.items.some(i=>i.quantity>i.available)){this.error='A quantity exceeds displayed stock. Refresh products and try again.';return;}
    this.saving=true;
    this.api.createSale({customerName:sale.customerName||'Walk-in customer',customerPhone:sale.customerPhone,paymentMethod:sale.paymentMethod,amountPaid:sale.amountPaid||0,discount:sale.discount,items:this.items.map(i=>({productId:i.productId,quantity:i.quantity,unitPrice:i.unitPrice}))})
      .subscribe({
        next:s=>{
          this.message=`Sale ${s.invoiceNumber} saved.`;
          this.items=[];this.saleForm.reset({customerName:'',customerPhone:'',paymentMethod:'CASH',amountPaid:0,discount:0});this.saving=false;
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
