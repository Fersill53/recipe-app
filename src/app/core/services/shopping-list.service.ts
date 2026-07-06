import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ShoppingListItem {
  id?: string;
  user_id?: string;
  name: string;
  is_checked: boolean;
  group_name?: string | null;
  group_image_url?: string | null;
  created_at?: string;
}

export interface ShoppingListGroup {
  groupName: string | null;
  groupImageUrl: string | null;
  items: ShoppingListItem[];
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

  groups = computed<ShoppingListGroup[]>(() => {
    const groups: ShoppingListGroup[] = [];
    const indexByName = new Map<string, number>();

    for (const item of this.items()) {
      const key = item.group_name ?? '';
      let index = indexByName.get(key);
      if (index === undefined) {
        index = groups.length;
        indexByName.set(key, index);
        groups.push({ groupName: item.group_name ?? null, groupImageUrl: item.group_image_url ?? null, items: [] });
      }
      groups[index].items.push(item);
    }

    return groups;
  });

  groupByName(groupName: string | null): ShoppingListGroup | undefined {
    return this.groups().find(g => g.groupName === groupName);
  }

  async groupExists(groupName: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('shopping_list_items')
      .select('id')
      .eq('group_name', groupName)
      .limit(1);
    return !error && (data?.length ?? 0) > 0;
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

  async addItems(names: string[], groupName?: string, groupImageUrl?: string): Promise<void> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const rows = names.filter(Boolean).map(name => ({
      name,
      user_id: userId,
      is_checked: false,
      group_name: groupName ?? null,
      group_image_url: groupImageUrl ?? null,
    }));
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

  async deleteGroup(groupName: string | null): Promise<void> {
    const idsToDelete = this.items()
      .filter(i => (i.group_name ?? null) === groupName)
      .map(i => i.id!);
    if (idsToDelete.length === 0) return;
    this.items.update(items => items.filter(i => (i.group_name ?? null) !== groupName));
    await this.supabase.client
      .from('shopping_list_items')
      .delete()
      .in('id', idsToDelete);
  }

  async clearCheckedInGroup(groupName: string | null): Promise<void> {
    const checkedIds = this.items()
      .filter(i => (i.group_name ?? null) === groupName && i.is_checked)
      .map(i => i.id!);
    if (checkedIds.length === 0) return;
    this.items.update(items => items.filter(i => !(checkedIds.includes(i.id!))));
    await this.supabase.client
      .from('shopping_list_items')
      .delete()
      .in('id', checkedIds);
  }
}
