import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'products', loadComponent: () => import('./pages/products.component').then(m => m.ProductsComponent) },
  { path: 'purchases', loadComponent: () => import('./pages/purchases.component').then(m => m.PurchasesComponent) },
  { path: 'sales', loadComponent: () => import('./pages/sales.component').then(m => m.SalesComponent) },
  { path: 'inventory', loadComponent: () => import('./pages/inventory.component').then(m => m.InventoryComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
