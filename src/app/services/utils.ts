import { inject, Injectable } from '@angular/core';
import { AlertController, LoadingController, ToastController, ToastOptions } from '@ionic/angular';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class Utils {

  loadingCtrl = inject(LoadingController)
  toastCtrl = inject(ToastController)
  router = inject(Router)
  alertCtrl = inject(AlertController);

  // ======= ⚠️ ALERT =======
  async presentAlert(options: { header?: string; subHeader?: string; message: string; buttons: any[]; }) {
    const alert = await this.alertCtrl.create({
      header: options.header || 'Alerta',
      subHeader: options.subHeader || '',
      message: options.message,
      buttons: options.buttons,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }




  // loading


  loading() {
    return this.loadingCtrl.create({ spinner: 'crescent' })
  }

  // toast

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    toast.present();
  }

  // enruta a cualquier pagina que se encuentre disponible

  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }



  // guardar elementos localmente

  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value))
  }

  // obtener desde el localStorage

  getFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key))
  }


}
