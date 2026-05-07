import { Routes } from '@angular/router';
import { LoginView } from './views/login/login';

export const routes: Routes = [
  { path: '', component: LoginView },
  { path: 'login', component: LoginView },
  { path: '**', redirectTo: '' },
];
