import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CapabilityService } from '../../../services/capability.service';

interface NavigationItem {
  label: string;
  icon: string;
  path: string;
  permissions: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly capability = inject(CapabilityService);
  private readonly router = inject(Router);

  protected isSidebarCollapsed = false;
  private readonly mobileBreakpoint = 900;

  private readonly allNavItems: NavigationItem[] = [
    { label: 'Catalog', icon: '/nav-icons/catalog.png', path: '/catalog', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Allotments', icon: '/nav-icons/allotments.png', path: '/allotments', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Orders', icon: '/nav-icons/orders.png', path: '/orders', permissions: ['ORDERS_READ'] },
    { label: 'Works', icon: '/nav-icons/assignments.png', path: '/works', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Accounting', icon: '/nav-icons/job-accounting.png', path: '/accounting', permissions: ['ACCOUNTING_READ'] },
    { label: 'Management', icon: '/nav-icons/management.png', path: '/management', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Assignments', icon: '/nav-icons/assignments.png', path: '/guide', permissions: ['GUIDE_TOURS_READ'] },
  ];

  protected readonly navItems = computed(() => {
    const isGuide = this.capability.isGuide();

    return this.allNavItems.filter((item) => {
      if (item.path === '/guide' && !isGuide) {
        return false;
      }
      return item.permissions.some((permission) => this.capability.can(permission));
    });
  });

  protected readonly currentUser = this.auth.currentUser;

  protected readonly initials = computed(() => {
    const name = this.currentUser()?.fullName || '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  });

  ngOnInit(): void {
    this.syncSidebarState(window.innerWidth);

    if (this.auth.isLoggedIn() && !this.auth.currentUser()?.permissions?.length) {
      this.auth.me().subscribe();
    }
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.syncSidebarState(window.innerWidth);
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  private syncSidebarState(width: number): void {
    this.isSidebarCollapsed = width < this.mobileBreakpoint;
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected switchToGuideView(): void {
    this.auth.setTourGuideViewMode(true);
    this.router.navigate(['/guide']);
  }

  protected switchToAdminView(): void {
    this.auth.setTourGuideViewMode(false);
    this.auth.navigateHome();
  }

  protected showViewSwitcher(): boolean {
    return this.capability.can('VIEW_SWITCH_TOUR_GUIDE');
  }

  protected inGuideViewMode(): boolean {
    return this.auth.tourGuideViewMode();
  }
}
