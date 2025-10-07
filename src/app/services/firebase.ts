import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  
  auth = inject(AngularFireAuth);


// Auntenticacion

// Acceder

  signIn(user:User){
    return signInWithEmailAndPassword(getAuth(), user.email, user.password)
  }

}
