import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';
import { guideGuard } from './guards/guide.guard';

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
    path: 'accounting',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['ACCOUNTING_READ'] },
    loadComponent: () => import('./views/accounting/accounting').then((m) => m.AccountingView),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [permissionGuard],
        data: { permissions: ['ORDERS_READ'] },
        loadComponent: () => import('./views/orders/orders').then((m) => m.OrdersView),
      },
      {
        path: ':id',
        canActivate: [permissionGuard],
        data: { permissions: ['ORDERS_READ', 'GUIDE_TOURS_READ'] },
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
    canActivate: [authGuard, guideGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./views/guide/guide').then((m) => m.GuideView),
      },
      {
        path: 'work/:id',
        loadComponent: () => import('./views/guide/guide-work-detail/guide-work-detail').then((m) => m.GuideWorkDetail),
      }
    ]
  },
];
