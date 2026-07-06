import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'shopping-list',
    loadComponent: () => import('./features/shopping-list/shopping-list.component/shopping-list.component').then(m => m.ShoppingListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'shopping-list/:group',
    loadComponent: () => import('./features/shopping-list/shopping-list-group.component/shopping-list-group.component').then(m => m.ShoppingListGroupComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes',
    loadComponent: () => import('./features/recipes/recipe-list.component/recipe-list.component').then(m => m.RecipeListComponent),
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
