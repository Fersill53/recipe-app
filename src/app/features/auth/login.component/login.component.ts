import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  mode = signal<'signin' | 'signup'>('signin');

  toggleMode() {
    this.mode.set(this.mode() === 'signin' ? 'signup' : 'signin');
    this.error.set(null);
    this.message.set(null);
  }

  async submit() {
    if (!this.email().trim() || !this.password().trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    if (this.mode() === 'signin') {
      const { error } = await this.authService.signIn(this.email(), this.password());
      if (error) this.error.set(error.message);
    } else {
      const { error } = await this.authService.signUp(this.email(), this.password());
      if (error) this.error.set(error.message);
      else this.message.set('Check your email to confirm your account, then sign in.');
    }

    this.loading.set(false);
  }
}
