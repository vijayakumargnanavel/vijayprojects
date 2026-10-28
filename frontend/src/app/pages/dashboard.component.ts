import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardReport } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <section class="page-heading"><div><p class="eyebrow">OVERVIEW</p><h2>Good day 👋</h2><p class="muted">Here's how your shop is doing today.</p></div></section>
    <p class="error" *ngIf="error">{{ error }}</p>
    <section class="stats">
      <article class="stat-card"><span class="stat-icon blue">▤</span><p>Active products</p><h3>{{ data?.productCount ?? '—' }}</h3><small>Items in catalogue</small></article>
      <article class="stat-card"><span class="stat-icon amber">!</span><p>Low stock</p><h3>{{ data?.lowStockCount ?? '—' }}</h3><small>Need attention</small></article>
      <article class="stat-card"><span class="stat-icon green">↗</span><p>Today's sales</p><h3>{{ data?.salesTotal | currency:'INR':'symbol':'1.0-2' }}</h3><small>Completed invoices</small></article>
      <article class="stat-card"><span class="stat-icon purple">₹</span><p>Stock value</p><h3>{{ data?.stockValue | currency:'INR':'symbol':'1.0-2' }}</h3><small>At recorded cost price</small></article>
    </section>
    <section class="panel"><h3>Start here</h3><div class="quick-grid"><a routerLink="/products" aria-label="Add products">＋ Add products <span>Build your product catalogue</span></a><a routerLink="/purchases" aria-label="Record purchase">↓ Record purchase <span>Receive stock from a supplier</span></a><a routerLink="/sales" aria-label="Create sale">＋ Create sale <span>Bill a customer</span></a><a routerLink="/inventory" aria-label="View stock">◷ View stock <span>Check levels and movement history</span></a></div></section>
    <p class="muted footnote">Gross profit is an estimate based on saved item cost snapshots. This starter does not calculate GST.</p>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private changeDetector = inject(ChangeDetectorRef);
  data?: DashboardReport;
  error = '';
  ngOnInit() {
    this.api.dashboard().subscribe({
      next: data => {
        this.data = data;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.error = 'Could not load dashboard. Is the backend running?';
        this.changeDetector.markForCheck();
      }
    });
  }
}
