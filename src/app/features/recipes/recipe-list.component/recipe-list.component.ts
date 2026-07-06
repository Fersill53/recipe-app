import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent implements OnInit {
  protected recipeService = inject(RecipeService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  searchQuery = signal('');

  filteredRecipes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.recipeService.recipes();
    return this.recipeService.recipes().filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      (recipe.description ?? '').toLowerCase().includes(query)
    );
  });

  async ngOnInit() {
    await this.recipeService.loadRecipes();
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
}
