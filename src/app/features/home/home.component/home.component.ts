import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface MenuCard {
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly cards: MenuCard[] = [
    { title: 'Recipes', description: 'Browse, search, and add recipes', route: '/recipes' },
    { title: 'Shopping List', description: 'Build and check off your shopping list', route: '/shopping-list' },
  ];
}
