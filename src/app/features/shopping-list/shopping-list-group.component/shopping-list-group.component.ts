import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShoppingListService } from '../../../core/services/shopping-list.service';
import { groupNameFromRouteParam } from '../group-route-param';

@Component({
  selector: 'app-shopping-list-group',
  standalone: true,
  imports: [],
  templateUrl: './shopping-list-group.component.html',
})
export class ShoppingListGroupComponent implements OnInit {
  protected shoppingListService = inject(ShoppingListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  groupName = signal<string | null>(null);

  group = computed(() => this.shoppingListService.groupByName(this.groupName()));

  async ngOnInit() {
    const param = this.route.snapshot.paramMap.get('group') ?? '';
    this.groupName.set(groupNameFromRouteParam(param));

    if (this.shoppingListService.items().length === 0) {
      await this.shoppingListService.loadItems();
    }
  }

  toggleChecked(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.shoppingListService.toggleChecked(id, isChecked);
  }

  deleteItem(id: string) {
    this.shoppingListService.deleteItem(id);
  }

  clearChecked() {
    this.shoppingListService.clearCheckedInGroup(this.groupName());
  }

  async removeAll() {
    if (!confirm('Remove this whole card from your shopping list?')) return;
    await this.shoppingListService.deleteGroup(this.groupName());
    this.router.navigate(['/shopping-list']);
  }

  goBack() {
    this.router.navigate(['/shopping-list']);
  }
}
