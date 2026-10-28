import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-icon">P</span><div><strong>Amman Traders</strong><small>Inventory</small></div></div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">▦ <span>Dashboard</span></a>
          <a routerLink="/products" routerLinkActive="active">▤ <span>Products</span></a>
          <a routerLink="/purchases" routerLinkActive="active">↓ <span>Purchases</span></a>
          <a routerLink="/sales" routerLinkActive="active">↑ <span>Sales & Bills</span></a>
          <a routerLink="/inventory" routerLinkActive="active">◷ <span>Stock history</span></a>
        </nav>
        <div class="sidebar-note">Single shop · Local inventory</div>
      </aside>
      <main class="main">
        <header class="topbar"><div><small>SHOP MANAGEMENT</small><h1>Amman Inventory workspace</h1></div><span class="status" [style.background]="apiAvailable?'#e9f8f0':'#fff0ef'" [style.color]="apiAvailable?'#23734b':'#b33b34'"><i [style.background]="apiAvailable?'#2eb779':'#d34f48'"></i>{{apiAvailable?'API connected':'API unavailable'}}</span></header>
        <router-outlet />
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  private api=inject(ApiService);
  apiAvailable=false;
  ngOnInit(){this.api.health().subscribe({next:()=>this.apiAvailable=true,error:()=>this.apiAvailable=false});}
}
