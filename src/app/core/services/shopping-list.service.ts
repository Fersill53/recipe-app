import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ShoppingListItem {
  id?: string;
  user_id?: string;
  name: string;
  is_checked: boolean;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private supabase = inject(SupabaseService);

  items = signal<ShoppingListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadItems() {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.supabase.client
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true });
    this.loading.set(false);
    if (error) this.error.set(error.message);
    else this.items.set(data ?? []);
  }

  async addItem(name: string): Promise<void> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const { data, error } = await this.supabase.client
      .from('shopping_list_items')
      .insert({ name, user_id: userId, is_checked: false })
      .select()
      .single();
    if (!error && data) this.items.update(items => [...items, data]);
  }

  async addItems(names: string[]): Promise<void> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const rows = names.filter(Boolean).map(name => ({ name, user_id: userId, is_checked: false }));
    if (rows.length === 0) return;
    const { data, error } = await this.supabase.client
      .from('shopping_list_items')
      .insert(rows)
      .select();
    if (!error && data) this.items.update(items => [...items, ...data]);
  }

  async toggleChecked(id: string, isChecked: boolean): Promise<void> {
    this.items.update(items => items.map(i => i.id === id ? { ...i, is_checked: isChecked } : i));
    await this.supabase.client
      .from('shopping_list_items')
      .update({ is_checked: isChecked })
      .eq('id', id);
  }

  async deleteItem(id: string): Promise<void> {
    this.items.update(items => items.filter(i => i.id !== id));
    await this.supabase.client
      .from('shopping_list_items')
      .delete()
      .eq('id', id);
  }

  async clearChecked(): Promise<void> {
    const checkedIds = this.items().filter(i => i.is_checked).map(i => i.id!);
    if (checkedIds.length === 0) return;
    this.items.update(items => items.filter(i => !i.is_checked));
    await this.supabase.client
      .from('shopping_list_items')
      .delete()
      .in('id', checkedIds);
  }
}
