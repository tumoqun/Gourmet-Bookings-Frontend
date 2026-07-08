import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Sidebar } from './components/common/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { CapabilityService } from './services/capability.service';

interface NavigationItem {
  label: string;
  icon: string;
  path: string;
  permissions: string[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Sidebar, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  router = inject(Router);
  auth = inject(AuthService);
  private readonly capability = inject(CapabilityService);

  private readonly allNavItems: NavigationItem[] = [
    { label: 'Catalog', icon: '/nav-icons/catalog.png', path: '/catalog', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Allotments', icon: '/nav-icons/allotments.png', path: '/allotments', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Orders', icon: '/nav-icons/orders.png', path: '/orders', permissions: ['ORDERS_READ'] },
    { label: 'Works', icon: '/nav-icons/assignments.png', path: '/works', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Accounting', icon: '/nav-icons/job-accounting.png', path: '/accounting', permissions: ['ACCOUNTING_READ'] },
    { label: 'Management', icon: '/nav-icons/management.png', path: '/management', permissions: ['ASSIGNMENTS_READ'] },
    { label: 'Tour Guide', icon: '/nav-icons/assignments.png', path: '/guide', permissions: ['GUIDE_TOURS_READ'] },
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

  get hideSidebar(): boolean {
    return ['/login', '/register', '/forgot-password'].includes(this.router.url);
  }

  logout(): void {
    this.auth.logout();
  }
}
