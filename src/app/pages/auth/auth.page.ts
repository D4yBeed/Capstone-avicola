import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        // 🔹 Autenticación con Firebase Auth
        const res = await this.firebaseSvc.signIn(this.form.value as User);

        // 🔹 Obtener información completa del usuario desde Firestore
        await this.getUserInfo(res.user.uid);

      } catch (error: any) {
        console.error(error);
        this.utilsSvc.presentToast({
          message: error.message || 'Error al iniciar sesión',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      } finally {
        loading.dismiss();
      }
    }
  }

  async getUserInfo(uid: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      const path = `users/${uid}`;
      const user = (await this.firebaseSvc.getDocument(path)) as User;

      if (user) {
        // 🧹 Limpiar datos antiguos y guardar el nuevo usuario
        localStorage.removeItem('user');
        this.utilsSvc.saveInLocalStorage('user', user);

        // 👤 Redirigir al home
        this.utilsSvc.routerLink('/main/home');
        this.form.reset();

        // 👋 Mensaje de bienvenida
        this.utilsSvc.presentToast({
          message: `Bienvenido ${user.name || user.email}!`,
          duration: 2000,
          color: 'secondary',
          position: 'middle',
          icon: 'person-circle-outline'
        });
      } else {
        this.utilsSvc.presentToast({
          message: 'No se encontraron datos del usuario en la base de datos.',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      }
    } catch (error) {
      console.error(error);
      this.utilsSvc.presentToast({
        message: 'Error al obtener información del usuario',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}
