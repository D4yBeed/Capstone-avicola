import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false,
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils)

  ngOnInit() {
  }


  async submit() {
    if (this.form.value) {

      const loading = await  this.utilsSvc.loading(); 
      await loading.present();

      this.firebaseSvc.sigIn(this.form.value as User).then(res => {
        console.log(res);
        
      }).catch(error => {
        console.log(error);

        this.utilsSvc.presentToast({
          message: error.message,
          duration: 2500, 
          color: 'secondary',
          position: 'middle',
          icon: 'alert-circle-outline'
        })

      }).finally(() =>{
        loading.dismiss();
      })
    }
  }


}
