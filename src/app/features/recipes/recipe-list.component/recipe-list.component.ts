import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent implements OnInit {
  protected recipeService = inject(RecipeService);
  protected authService = inject(AuthService);
  protected favoriteService = inject(FavoriteService);
  private router = inject(Router);

  searchQuery = signal('');
  selectedTag = signal<string | null>(null);
  favoritesOnly = signal(false);

  allTags = computed(() => {
    const tags = new Set<string>();
    for (const recipe of this.recipeService.recipes()) {
      for (const tag of recipe.tags ?? []) tags.add(tag);
    }
    return [...tags].sort();
  });

  filteredRecipes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();
    const favoritesOnly = this.favoritesOnly();

    return this.recipeService.recipes().filter(recipe => {
      if (query && !recipe.title.toLowerCase().includes(query) && !(recipe.description ?? '').toLowerCase().includes(query)) {
        return false;
      }
      if (tag && !(recipe.tags ?? []).includes(tag)) return false;
      if (favoritesOnly && !this.favoriteService.isFavorite(recipe.id!)) return false;
      return true;
    });
  });

  async ngOnInit() {
    await this.recipeService.loadRecipes();
    if (this.authService.isLoggedIn) await this.favoriteService.loadFavorites();
  }

  goToRecipe(id: string) {
    this.router.navigate(['/recipes', id]);
  }

  goToNew() {
    this.router.navigate(['/recipes/new']);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  toggleTag(tag: string) {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
  }

  toggleFavoritesOnly() {
    this.favoritesOnly.set(!this.favoritesOnly());
  }

  toggleFavorite(event: Event, recipeId: string) {
    event.stopPropagation();
    this.favoriteService.toggleFavorite(recipeId);
  }
}
