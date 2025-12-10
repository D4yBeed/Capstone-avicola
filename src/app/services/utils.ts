import { Injectable } from '@angular/core';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Utils {

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  //  Crear alertas reutilizables
  async presentAlert(options: {
    header?: string;
    message?: string;
    buttons?: any[];
  }) {
    const alert = await this.alertCtrl.create({
      header: options.header,
      message: options.message,
      buttons: options.buttons || ['OK']
    });
    return alert; // 👈 devolvemos el alert (no void)
  }

  // Crear toasts reutilizables
  async presentToast(options: {
    message: string;
    color?: string;
    duration?: number;
    position?: 'top' | 'middle' | 'bottom';
    icon?: string;
  }) {
    const toast = await this.toastCtrl.create({
      message: options.message,
      duration: options.duration || 2000,
      color: options.color || 'primary',
      position: options.position || 'bottom',
      icon: options.icon
    });
    toast.present();
  }

  // Loading reutilizable
  async loading(message: string = 'Cargando...') {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    return loading;
  }

  // Navegación rápida
  routerLink(url: string) {
    this.router.navigateByUrl(url);
  }

  // LocalStorage Helpers
  saveInLocalStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getFromLocalStorage(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}
