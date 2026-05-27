import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/login/login').then((m) => m.LoginView),
  },
  {
    path: 'login',
    loadComponent: () => import('./views/login/login').then((m) => m.LoginView),
  },
  {
    path: 'orders',
    loadComponent: () => import('./views/orders/orders').then((m) => m.OrdersView),
  },
  {
    path: 'works',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./views/works/works').then((m) => m.Works),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./views/works/detail/detail').then((m) => m.WorkDetail),
      },
    ],
  },
];
