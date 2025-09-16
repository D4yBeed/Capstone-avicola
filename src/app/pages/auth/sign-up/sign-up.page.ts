import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone:false,
})
export class SignUpPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)])
  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils)

  ngOnInit() {
  }


  async submit() {
    if (this.form.value) {

      const loading = await  this.utilsSvc.loading(); 
      await loading.present();

      this.firebaseSvc.sigUp(this.form.value as User).then(async res => {
        await this.firebaseSvc.UpdateUser(this.form.value.name);
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


// import { Component, inject, OnInit } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { User } from 'src/app/models/user.model';
// import { FirebaseService } from 'src/app/services/firebase.service';
// import { Utils } from 'src/app/services/utils';

// @Component({
//   selector: 'app-sign-up',
//   templateUrl: './sign-up.page.html',
//   styleUrls: ['./sign-up.page.scss'],
//   standalone: false,
// })
// export class SignUpPage implements OnInit {

//   form = new FormGroup({
//     email: new FormControl('', [Validators.required, Validators.email]),
//     password: new FormControl('', [Validators.required, Validators.minLength(6)]),
//     name: new FormControl('', [Validators.required, Validators.minLength(4)])
//   });

//   firebaseSvc = inject(FirebaseService);
//   utilsSvc = inject(Utils);

//   ngOnInit() {}

//   async submit() {
//     if (!this.form.valid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     const { email, password, name } = this.form.value as User;

//     const loading = await this.utilsSvc.loading();
//     await loading.present();

//     this.firebaseSvc.sigUp({ email, password, name }).then(async res => {
//       await this.firebaseSvc.UpdateUser(name);
//       console.log('Usuario registrado:', res);
//       this.utilsSvc.presentToast({
//         message: 'Registro exitoso',
//         duration: 2500,
//         color: 'success',
//         position: 'bottom',
//         icon: 'checkmark-circle-outline'
//       });
//     }).catch(error => {
//       console.error('Error en registro:', error);
//       this.utilsSvc.presentToast({
//         message: error.message,
//         duration: 2500,
//         color: 'danger',
//         position: 'middle',
//         icon: 'alert-circle-outline'
//       });
//     }).finally(() => {
//       loading.dismiss();
//     });
//   }
// }
