import { Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface LoginCredentials {
  account: string;
  password: string;
}

@Component({
  selector: 'lib-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly submitted = output<LoginCredentials>();
  readonly form = this.formBuilder.group({
    account: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}
