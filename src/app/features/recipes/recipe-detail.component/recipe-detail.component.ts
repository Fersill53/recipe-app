import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Recipe, RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShoppingListService } from '../../../core/services/shopping-list.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [],
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit {
  private recipeService = inject(RecipeService);
  protected authService = inject(AuthService);
  private shoppingListService = inject(ShoppingListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  recipe = signal<Recipe | null>(null);
  loading = signal(true);
  addedToShoppingList = signal(false);

  get isOwner() {
    return this.authService.user()?.id === this.recipe()?.user_id;
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const recipe = await this.recipeService.getRecipe(id);
    this.recipe.set(recipe);
    this.loading.set(false);

    if (recipe && this.authService.isLoggedIn) {
      this.addedToShoppingList.set(await this.shoppingListService.groupExists(recipe.title));
    }
  }

  goToEdit() {
    this.router.navigate(['/recipes', this.recipe()!.id, 'edit']);
  }

  async deleteRecipe() {
    if (!confirm('Delete this recipe?')) return;
    await this.recipeService.deleteRecipe(this.recipe()!.id!);
    this.router.navigate(['/']);
  }

  goBack() {
    this.router.navigate(['/recipes']);
  }

  async addToShoppingList() {
    await this.shoppingListService.addItems(
      this.recipe()!.ingredients,
      this.recipe()!.title,
      this.recipe()!.image_url,
    );
    this.addedToShoppingList.set(true);
  }
}
