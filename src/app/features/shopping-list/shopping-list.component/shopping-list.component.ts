import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../../core/services/shopping-list.service';
import { groupRouteParam } from '../group-route-param';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './shopping-list.component.html',
})
export class ShoppingListComponent implements OnInit {
  protected shoppingListService = inject(ShoppingListService);
  private router = inject(Router);

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

  openGroup(groupName: string | null) {
    this.router.navigate(['/shopping-list', groupRouteParam(groupName)]);
  }
}
