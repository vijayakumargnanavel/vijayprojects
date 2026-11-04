import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService, Product } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private changeDetector = inject(ChangeDetectorRef);
  products: Product[] = []; error = ''; message = ''; saving = false;
  units = ['piece','can','bucket','box','litre','ml','kg','gram','metre','foot'];
  editingId = '';
  searchControl = new FormControl('', { nonNullable: true });
  productForm = this.blankForm();
  blankForm() {
    return new FormGroup({
      sku: new FormControl('', { nonNullable: true }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      category: new FormControl('Paint', { nonNullable: true, validators: [Validators.required] }),
      brand: new FormControl('', { nonNullable: true }),
      variant: new FormControl('', { nonNullable: true }),
      unit: new FormControl('piece', { nonNullable: true }),
      costPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      sellingPrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      reorderLevel: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
    });
  }
  ngOnInit() { this.load(); }
  load() {
    this.api.products(this.searchControl.value.trim()).subscribe({
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
  reset() { this.productForm = this.blankForm(); this.editingId=''; }
  edit(product: Product) {
    this.editingId = product._id;
    this.productForm.reset({
      sku: product.sku, name: product.name, category: product.category,
      brand: product.brand || '', variant: product.variant || '', unit: product.unit,
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel
    });
    this.error = '';
    this.message = '';
  }
  add() {
    this.error=''; this.message='';
    const values = this.productForm.getRawValue();
    if ((!this.editingId && !values.sku.trim()) || !values.name.trim() || !values.category.trim()
      || !Number.isFinite(Number(values.costPrice)) || Number(values.costPrice) < 0
      || !Number.isFinite(Number(values.sellingPrice)) || Number(values.sellingPrice) < 0
      || !Number.isFinite(Number(values.reorderLevel)) || Number(values.reorderLevel) < 0
      || this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.error='Enter the required fields and valid prices.';
      return;
    }
    const payload = { ...values, sku: values.sku.trim(), name: values.name.trim(), category: values.category.trim() };
    const editing = Boolean(this.editingId);
    const request = editing
      ? this.api.updateProduct(this.editingId, payload)
      : this.api.createProduct(payload);
    this.saving=true;
    request.pipe(finalize(() => {
      this.saving=false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: p => {
        this.message = editing ? `Updated ${p.name}.` : `Added ${p.name}. Stock starts at zero; record a purchase to receive stock.`;
        if (!editing) this.searchControl.setValue('');
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
