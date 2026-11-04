import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Product, StockMovement } from '../core/api.service';

@Component({
  standalone:true,imports:[CommonModule,ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  
})
export class InventoryComponent implements OnInit {
  private api=inject(ApiService);private changeDetector=inject(ChangeDetectorRef);
  products:Product[]=[];adjustmentProducts:Product[]=[];movements:StockMovement[]=[];error='';message='';adjusting=false;
  lowOnlyControl = new FormControl(false, { nonNullable: true });
  adjustmentForm = new FormGroup({
    productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  ngOnInit(){this.loadStock();this.loadAdjustmentProducts();this.loadMovements();}
  loadStock(){this.api.stock(this.lowOnlyControl.value).subscribe({
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
    const adjustment = this.adjustmentForm.getRawValue();
    if(!adjustment.productId||!Number.isFinite(Number(adjustment.quantity))||Number(adjustment.quantity)===0||!adjustment.reason.trim()){
      this.adjustmentForm.markAllAsTouched();
      this.error='Choose a product, enter a non-zero quantity and provide a reason.';
      return;
    }
    this.adjusting=true;
    this.api.adjustStock({...adjustment,quantity:Number(adjustment.quantity)}).subscribe({
      next:p=>{
        this.message=`Stock adjusted for ${p.name}.`;
        this.adjustmentForm.reset({productId:'',quantity:0,reason:''});
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
