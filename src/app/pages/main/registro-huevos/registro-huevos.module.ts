import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroHuevosPageRoutingModule } from './registro-huevos-routing.module';

import { RegistroHuevosPage } from './registro-huevos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroHuevosPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [RegistroHuevosPage]
})
export class RegistroHuevosPageModule {}
