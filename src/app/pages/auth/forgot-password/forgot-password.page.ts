import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false
})
export class ForgotPasswordPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  })

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {
  }

  async submit() {
    if (this.form.valid) {

      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.sendRecoveryEmail(this.form.value.email).then(res => {

        this.utilsSvc.presentToast({
          message: 'El correo ha sido enviado con éxito.',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'mail-outline'
        });

        this.utilsSvc.routerLink('/auth');
        this.form.reset();

      }).catch(error => {
        console.log(error);

        // 🔹 TRADUCCIÓN DE ERRORES AL ESPAÑOL
        let errorMessage = 'Ocurrió un error al enviar el correo.';

        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Este correo no está registrado en nuestra aplicación.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'El correo ingresado no es válido.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Has intentado demasiadas veces. Espera unos minutos.';
        }

        this.utilsSvc.presentToast({
          message: errorMessage, // Mensaje traducido
          duration: 4000,
          color: 'danger',       // Color rojo para errores
          position: 'middle',
          icon: 'alert-circle-outline'
        });

      }).finally(() => {
        loading.dismiss();
      });
    }
  }

}