import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./views/login/login').then((m) => m.LoginView),
  },
  {
    path: 'orders',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['ORDERS_READ'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./views/orders/orders').then((m) => m.OrdersView),
      },
      {
        path: ':id',
        loadComponent: () => import('./views/orders/detail/detail').then((m) => m.OrderDetail),
      },
    ],
  },
  {
    path: 'works',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['ASSIGNMENTS_READ'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./views/works/works').then((m) => m.Works),
      },
      {
        path: ':id',
        loadComponent: () => import('./views/works/detail/detail').then((m) => m.WorkDetail),
      },
    ],
  },
  {
    path: 'guide',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['GUIDE_TOURS_READ'] },
    loadComponent: () => import('./views/guide/guide').then((m) => m.GuideView),
  },
];
