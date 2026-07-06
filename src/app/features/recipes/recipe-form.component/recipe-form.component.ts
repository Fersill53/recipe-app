import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-form.component.html',
})
export class RecipeFormComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  recipeId = signal<string | null>(null);
  title = signal('');
  description = signal('');
  ingredientsText = signal('');
  instructions = signal('');
  imageUrl = signal('');
  servings = signal<number | null>(null);
  prepTime = signal<number | null>(null);
  cookTime = signal<number | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);

  get isEditing() {
    return !!this.recipeId();
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.recipeId.set(id);
    const recipe = await this.recipeService.getRecipe(id);
    if (!recipe) return;

    this.title.set(recipe.title);
    this.description.set(recipe.description ?? '');
    this.ingredientsText.set(recipe.ingredients.join('\n'));
    this.instructions.set(recipe.instructions);
    this.imageUrl.set(recipe.image_url ?? '');
    this.servings.set(recipe.servings ?? null);
    this.prepTime.set(recipe.prep_time_minutes ?? null);
    this.cookTime.set(recipe.cook_time_minutes ?? null);
  }

  async save() {
    if (!this.title().trim() || !this.instructions().trim()) return;

    this.saving.set(true);
    this.error.set(null);

    const payload = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      ingredients: this.ingredientsText().split('\n').map(i => i.trim()).filter(Boolean),
      instructions: this.instructions().trim(),
      image_url: this.imageUrl().trim() || undefined,
      servings: this.servings() ?? undefined,
      prep_time_minutes: this.prepTime() ?? undefined,
      cook_time_minutes: this.cookTime() ?? undefined,
    };

    const result = this.isEditing
      ? await this.recipeService.updateRecipe(this.recipeId()!, payload)
      : await this.recipeService.createRecipe({ ...payload, user_id: this.authService.user()?.id });

    this.saving.set(false);

    if (!result) {
      this.error.set(this.recipeService.error() ?? 'Failed to save recipe.');
      return;
    }

    this.router.navigate(['/recipes', result.id]);
  }

  cancel() {
    if (this.isEditing) this.router.navigate(['/recipes', this.recipeId()]);
    else this.router.navigate(['/']);
  }
}
