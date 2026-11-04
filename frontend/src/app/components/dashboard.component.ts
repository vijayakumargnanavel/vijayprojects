import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardReport } from '../core/api.service';

@Component({
  standalone: true, imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  
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
