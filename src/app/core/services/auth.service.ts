import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  user = signal<any>(null);
  loading = signal(true);

  async init() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    this.user.set(session?.user ?? null);
    this.loading.set(false);

    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.user.set(session?.user ?? null);
      if (event === 'SIGNED_OUT') this.router.navigate(['/login']);
    });
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
}
