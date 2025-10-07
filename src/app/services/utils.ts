import { inject, Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class Utils {
  
  loadingCtrl = inject(LoadingController)


}
