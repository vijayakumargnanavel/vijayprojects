import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Product, Supplier, Invoice } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchases.component.html',
  
})
export class PurchasesComponent implements OnInit {
  private api=inject(ApiService);
  private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[]; suppliers:Supplier[]=[]; history:Invoice[]=[]; items:PurchaseLine[]=[];
  supplierForm = new FormGroup({name: new FormControl('', {nonNullable:true, validators:[Validators.required]}), phone: new FormControl('', {nonNullable:true}), address: new FormControl('', {nonNullable:true})});
  purchaseForm = new FormGroup({
    supplierId: new FormControl('', {nonNullable:true}), supplierName: new FormControl('', {nonNullable:true}),
    supplierInvoiceNumber: new FormControl('', {nonNullable:true}), amountPaid: new FormControl(0, {nonNullable:true, validators:[Validators.min(0)]}),
    discount: new FormControl(0, {nonNullable:true, validators:[Validators.min(0)]}),
    selectedProductId: new FormControl('', {nonNullable:true}), qty: new FormControl(1, {nonNullable:true, validators:[Validators.required, Validators.min(0.001)]}),
    unitCost: new FormControl(0, {nonNullable:true, validators:[Validators.required, Validators.min(0)]})
  });
  savingSupplier=false;
  error=''; message=''; saving=false;
  get subtotal(){return this.items.reduce((s,i)=>s+i.quantity*i.unitCost,0);}
  get total(){return Math.max(0,Math.round((this.subtotal-this.purchaseForm.controls.discount.value)*100)/100);}
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
    const supplier=this.supplierForm.getRawValue();
    if(!supplier.name.trim()){this.supplierForm.markAllAsTouched();this.error='Enter a supplier name.';return;}
    this.savingSupplier=true;
    this.api.createSupplier(supplier).subscribe({
      next:s=>{
        this.suppliers=[...this.suppliers,s].sort((a,b)=>a.name.localeCompare(b.name));
        this.purchaseForm.patchValue({supplierId:s._id});
        this.supplierForm.reset({name:'',phone:'',address:''});
        this.message=`Supplier ${s.name} added.`;
        this.savingSupplier=false;
        this.changeDetector.markForCheck();
      },
      error:e=>{this.error=e.error?.message||'Unable to add supplier.';this.savingSupplier=false;this.changeDetector.markForCheck();}
    });
  }
  addLine(){
    const line=this.purchaseForm.getRawValue();
    const p=this.products.find(x=>x._id===line.selectedProductId);
    if(!p||!Number.isFinite(line.qty)||line.qty<=0||!Number.isFinite(line.unitCost)||line.unitCost<0){this.error='Choose a product and enter a valid quantity and cost.';return;}
    this.items.push({productId:p._id,name:p.name,sku:p.sku,unit:p.unit,quantity:Number(line.qty),unitCost:Number(line.unitCost)});
    this.error=''; this.purchaseForm.patchValue({selectedProductId:'',qty:1,unitCost:0});
  }
  remove(i:number){this.items.splice(i,1);}
  save(){
    this.error='';this.message='';
    const purchase=this.purchaseForm.getRawValue();
    if(!this.items.length||purchase.discount<0||purchase.discount>this.subtotal||purchase.amountPaid<0||purchase.amountPaid>this.total){this.error='Check items, discount and amount paid.';return;}
    this.saving=true;
    this.api.createPurchase({supplierId:purchase.supplierId||undefined,supplierName:purchase.supplierName,supplierInvoiceNumber:purchase.supplierInvoiceNumber,items:this.items,discount:purchase.discount,amountPaid:purchase.amountPaid||0})
      .subscribe({
        next:p=>{
          this.message=`Purchase ${p.invoiceNumber} saved. Stock updated.`;
          this.items=[];this.purchaseForm.patchValue({discount:0,amountPaid:0});this.saving=false;
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
