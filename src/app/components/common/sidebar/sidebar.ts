import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface NavigationItem {
  label: string;
  icon: string;
  active: boolean;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  protected isSidebarCollapsed = false;

  protected navItems: NavigationItem[] = [
    { label: 'Catalog', icon: '/nav-icons/catalog.png', active: false, path: '/catalog' },
    { label: 'Allotments', icon: '/nav-icons/allotments.png', active: false, path: '/allotments' },
    { label: 'Orders', icon: '/nav-icons/orders.png', active: false, path: '/orders' },
    { label: 'Works', icon: '/nav-icons/assignments.png', active: false, path: '/works' },
    { label: 'Accounting', icon: '/nav-icons/job-accounting.png', active: false, path: '/accounting' },
    { label: 'Management', icon: '/nav-icons/management.png', active: false, path: '/management' },
  ];

  ngOnInit(): void {
    // Set the active navigation item based on the current URL
    const currentPath = window.location.pathname;
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: item.path === currentPath,
    }));
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  protected setActiveNav(label: string): void {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: item.label === label,
    }));
  }
}
