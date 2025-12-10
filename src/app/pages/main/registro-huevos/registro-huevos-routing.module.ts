import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroHuevosPage } from './registro-huevos.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroHuevosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroHuevosPageRoutingModule {}
