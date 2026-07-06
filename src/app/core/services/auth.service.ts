import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  user = signal<any>(null);
  displayName = signal('');
  loading = signal(true);

  async init() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    this.setUser(session?.user ?? null);
    this.loading.set(false);

    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') this.router.navigate(['/login']);
    });
  }

  private setUser(user: any) {
    this.user.set(user);
    this.displayName.set(user?.user_metadata?.['full_name'] ?? '');
  }

  get isLoggedIn() {
    return !!this.user();
  }

  async signUp(email: string, password: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client.auth.signUp({ email, password });
    return { error };
  }

  async signIn(email: string, password: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  async updateName(fullName: string): Promise<{ error: any }> {
    const { data, error } = await this.supabase.client.auth.updateUser({
      data: { full_name: fullName },
    });
    if (!error) this.displayName.set(data.user.user_metadata?.['full_name'] ?? fullName);
    return { error };
  }

  async updateEmail(newEmail: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client.auth.updateUser({ email: newEmail });
    return { error };
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ error: any }> {
    const { error: signInError } = await this.supabase.client.auth.signInWithPassword({
      email: this.user()?.email,
      password: currentPassword,
    });
    if (signInError) return { error: { message: 'Current password is incorrect.' } };

    const { error } = await this.supabase.client.auth.updateUser({ password: newPassword });
    return { error };
  }
}
