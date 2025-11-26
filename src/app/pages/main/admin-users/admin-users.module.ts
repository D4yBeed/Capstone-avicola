import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminUsersPageRoutingModule } from './admin-users-routing.module';

import { AdminUsersPage } from './admin-users.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminUsersPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [AdminUsersPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]   
})
export class AdminUsersPageModule {}
