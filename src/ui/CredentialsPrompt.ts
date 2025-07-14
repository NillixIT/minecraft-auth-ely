// ui/CredentialsPrompt.ts

import { AuthContext } from '@nillixit/minecraft-auth-types';

export interface Credentials {
  email: string;
  password: string;
}

export class CredentialsPrompt {
  public static async prompt(ctx: AuthContext): Promise<Credentials> {
    return new Promise((resolve) => {
      ctx.showModal({
        title: 'Mojang Login',
        fields: [
          { label: 'Email', type: 'email', name: 'email' },
          { label: 'Password', type: 'password', name: 'password' }
        ],
        onSubmit: (data: any) => {
          ctx.closeModal();
          resolve({ email: data.email, password: data.password });
        }
      });
    });
  }
}
