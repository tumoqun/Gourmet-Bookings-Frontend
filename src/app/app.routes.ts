import { Routes } from '@angular/router';
import { LoginView } from './views/login/login';
import { OrdersView } from './views/orders/orders';
import { Works } from './views/works/works';

export const routes: Routes = [
  // { path: '', component: LoginView },
  // { path: 'login', component: LoginView },
  // { path: 'orders', component: OrdersView },
  // { path: 'works', component: Works },
  // { path: '**', redirectTo: '' },
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
    loadComponent: () => import('./views/works/works').then((m) => m.Works),
  },
];
