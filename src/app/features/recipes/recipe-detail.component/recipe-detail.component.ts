import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Recipe, RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShoppingListService } from '../../../core/services/shopping-list.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { RecipeNoteService } from '../../../core/services/recipe-note.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit {
  private recipeService = inject(RecipeService);
  protected authService = inject(AuthService);
  private shoppingListService = inject(ShoppingListService);
  protected favoriteService = inject(FavoriteService);
  private recipeNoteService = inject(RecipeNoteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  recipe = signal<Recipe | null>(null);
  loading = signal(true);
  addedToShoppingList = signal(false);

  rating = signal<number | null>(null);
  note = signal('');
  savingNote = signal(false);
  noteSaved = signal(false);

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
      await this.favoriteService.loadFavorites();

      const existingNote = await this.recipeNoteService.getNote(recipe.id!);
      if (existingNote) {
        this.rating.set(existingNote.rating);
        this.note.set(existingNote.note ?? '');
      }
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

  toggleFavorite() {
    this.favoriteService.toggleFavorite(this.recipe()!.id!);
  }

  setRating(value: number) {
    this.rating.set(this.rating() === value ? null : value);
  }

  async saveNote() {
    this.savingNote.set(true);
    this.noteSaved.set(false);
    await this.recipeNoteService.saveNote(this.recipe()!.id!, this.rating(), this.note().trim() || null);
    this.savingNote.set(false);
    this.noteSaved.set(true);
  }
}
