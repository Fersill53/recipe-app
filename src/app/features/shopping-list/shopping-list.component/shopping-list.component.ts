import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../../core/services/shopping-list.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './shopping-list.component.html',
})
export class ShoppingListComponent implements OnInit {
  protected shoppingListService = inject(ShoppingListService);

  newItemName = signal('');

  async ngOnInit() {
    await this.shoppingListService.loadItems();
  }

  async addItem() {
    const name = this.newItemName().trim();
    if (!name) return;
    this.newItemName.set('');
    await this.shoppingListService.addItem(name);
  }

  toggleChecked(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.shoppingListService.toggleChecked(id, isChecked);
  }

  deleteItem(id: string) {
    this.shoppingListService.deleteItem(id);
  }

  deleteGroup(groupName: string | null) {
    this.shoppingListService.deleteGroup(groupName);
  }

  clearChecked() {
    this.shoppingListService.clearChecked();
  }
}
