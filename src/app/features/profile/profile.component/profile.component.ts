import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  protected authService = inject(AuthService);

  fullName = signal('');
  savingName = signal(false);
  nameError = signal<string | null>(null);
  nameMessage = signal<string | null>(null);

  newEmail = signal('');
  savingEmail = signal(false);
  emailError = signal<string | null>(null);
  emailMessage = signal<string | null>(null);

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  savingPassword = signal(false);
  passwordError = signal<string | null>(null);
  passwordMessage = signal<string | null>(null);

  get email() {
    return this.authService.user()?.email ?? '';
  }

  ngOnInit() {
    this.fullName.set(this.authService.displayName());
    this.newEmail.set(this.email);
  }

  async saveName() {
    this.nameError.set(null);
    this.nameMessage.set(null);
    this.savingName.set(true);

    const { error } = await this.authService.updateName(this.fullName().trim());

    this.savingName.set(false);
    if (error) this.nameError.set(error.message);
    else this.nameMessage.set('Name updated.');
  }

  async saveEmail() {
    this.emailError.set(null);
    this.emailMessage.set(null);

    const newEmail = this.newEmail().trim();
    if (!newEmail || newEmail === this.email) return;

    this.savingEmail.set(true);
    const { error } = await this.authService.updateEmail(newEmail);
    this.savingEmail.set(false);

    if (error) this.emailError.set(error.message);
    else this.emailMessage.set('Check your inbox at both your old and new address to confirm the change.');
  }

  async savePassword() {
    this.passwordError.set(null);
    this.passwordMessage.set(null);

    if (this.newPassword().length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.savingPassword.set(true);
    const { error } = await this.authService.updatePassword(this.currentPassword(), this.newPassword());
    this.savingPassword.set(false);

    if (error) {
      this.passwordError.set(error.message);
    } else {
      this.passwordMessage.set('Password updated.');
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
  }
}
