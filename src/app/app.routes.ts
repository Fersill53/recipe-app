import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/recipes/recipe-list.component/recipe-list.component').then(m => m.RecipeListComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'recipes/new',
    loadComponent: () => import('./features/recipes/recipe-form.component/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./features/recipes/recipe-detail.component/recipe-detail.component').then(m => m.RecipeDetailComponent),
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () => import('./features/recipes/recipe-form.component/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
];
