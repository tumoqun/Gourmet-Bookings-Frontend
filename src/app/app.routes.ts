import { Routes } from '@angular/router';
import { LoginView } from './views/login/login';
import { OrdersView } from './views/orders/orders';

export const routes: Routes = [
  { path: '', component: LoginView },
  { path: 'login', component: LoginView },
  { path: 'orders', component: OrdersView },
  { path: '**', redirectTo: '' },
];
