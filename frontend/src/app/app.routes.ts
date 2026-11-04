import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'products', loadComponent: () => import('./components/products.component').then(m => m.ProductsComponent) },
  { path: 'purchases', loadComponent: () => import('./components/purchases.component').then(m => m.PurchasesComponent) },
  { path: 'sales', loadComponent: () => import('./components/sales.component').then(m => m.SalesComponent) },
  { path: 'inventory', loadComponent: () => import('./components/inventory.component').then(m => m.InventoryComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
