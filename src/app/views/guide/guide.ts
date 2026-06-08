import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { GuideAssignment, GuidePortalService } from '../../services/guide-portal.service';
import { AuthService } from '../../services/auth.service';
import { CapabilityService } from '../../services/capability.service';

@Component({
  selector: 'app-guide-view',
  imports: [CommonModule],
  templateUrl: './guide.html',
  styleUrl: './guide.css',
})
export class GuideView implements OnInit {
  private readonly guidePortal = inject(GuidePortalService);
  private readonly auth = inject(AuthService);
  protected readonly capability = inject(CapabilityService);

  protected assignments = signal<GuideAssignment[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAssignments();
  }

  protected loadAssignments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.guidePortal.getAssignments().subscribe({
      next: (items) => {
        this.assignments.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load assignments.');
        this.loading.set(false);
      },
    });
  }

  protected accept(id: number): void {
    this.guidePortal.acceptAssignment(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected reject(id: number): void {
    this.guidePortal.rejectAssignment(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected startWork(id: number): void {
    this.guidePortal.startWork(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected endWork(id: number): void {
    this.guidePortal.endWork(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected switchToAdminView(): void {
    this.auth.setTourGuideViewMode(false);
    this.auth.navigateHome();
  }
}
