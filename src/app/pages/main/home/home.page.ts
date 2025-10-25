import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { onAuthStateChanged } from 'firebase/auth';

import { Eggs, EggKey } from 'src/app/services/eggs';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

type Shed = { id: string; name: string; sector: number; letter: 'A' | 'B' };

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  form!: FormGroup;
  userId: string | null = null;
  ready = false;

  // Visualización
  selectedDate = ''; // 'YYYY-MM-DD'
  totalDia = 0;

  // Granja fija
  farms = [{ id: 'ELMOLLE', name: 'Granja El Molle' }];

  // Sectores y galpones A/B
  sectors = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Sector ${i + 1}` }));

  allSheds: Shed[] = Array.from({ length: 7 }, (_, i) => i + 1).reduce((acc, sector) => {
    (['A', 'B'] as ('A' | 'B')[]).forEach(letter => {
      acc.push({
        id: `S${sector}${letter}`, // ej: S1A
        name: `Sector ${sector} - Galpón ${letter}`,
        sector,
        letter
      });
    });
    return acc;
  }, [] as Shed[]);

  // Galpones filtrados según sector elegido
  sheds: Shed[] = [];

  categories: { key: EggKey; label: string }[] = [
    { key: 'incubables_nido', label: 'Incubables de nido' },
    { key: 'incubables_piso', label: 'Incubables de piso' },
    { key: 'sucios_nido', label: 'Sucios de nido' },
    { key: 'sucios_piso', label: 'Sucios de piso' },
    { key: 'trizados_nido', label: 'Trizados de nido' },
    { key: 'trizados_piso', label: 'Trizados de piso' },
    { key: 'dobles_nido', label: 'Dobles de nido' },
    { key: 'dobles_piso', label: 'Dobles de piso' },
  ];

  counts: Record<EggKey, number> = {
    incubables_nido: 0, incubables_piso: 0,
    sucios_nido: 0, sucios_piso: 0,
    trizados_nido: 0, trizados_piso: 0,
    dobles_nido: 0, dobles_piso: 0,
  };

  constructor(
    private fb: FormBuilder,
    private eggsSvc: Eggs,
    private fbSvc: Firebase,
    private utils: Utils
  ) {}
  
  firebaseSvc = inject(Firebase);
//   utilsSvc = inject(Utils);

  ngOnInit(): void {
    const todayISO = this.todayLocalISO();
    const todayYMD = todayISO.slice(0, 10);
    this.selectedDate = todayYMD;

    // Sector y galpón por defecto
    const defaultSector = this.sectors[0].id; // 1
    this.sheds = this.allSheds.filter(s => s.sector === defaultSector);

    // Formulario
    this.form = this.fb.group({
      date: [todayISO],
      farmId: [this.farms[0]?.id || ''],
      sectorId: [defaultSector],
      shedId: [this.sheds[0]?.id || ''],
      notes: [''],
    });

    // Cambia lista de galpones según sector seleccionado
    this.form.get('sectorId')!.valueChanges.subscribe((sec: number) => {
      this.sheds = this.allSheds.filter(s => s.sector === Number(sec));
      const first = this.sheds[0]?.id || '';
      this.form.patchValue({ shedId: first }, { emitEvent: false });
      this.loadRecord();
    });

    // Esperar autenticación y cargar registro actual
    onAuthStateChanged(this.fbSvc.getAuth(), async (u) => {
      this.userId = u?.uid ?? null;
      if (this.userId) {
        await this.loadRecord();
        // Reaccionar si cambia la granja o el galpón
        this.form.get('farmId')!.valueChanges.subscribe(() => this.loadRecord());
        this.form.get('shedId')!.valueChanges.subscribe(() => this.loadRecord());
      } else {
        this.ready = false;
      }
    });
  }

  // Fecha actual local en formato ISO
  private todayLocalISO(): string {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - tzOffset * 60000);
    return local.toISOString();
  }

  private isoToYmd(iso: string): string {
    return iso.slice(0, 10);
  }

  private calcTotal() {
    this.totalDia =
      (this.counts.incubables_nido || 0) +
      (this.counts.incubables_piso || 0) +
      (this.counts.sucios_nido || 0) +
      (this.counts.sucios_piso || 0) +
      (this.counts.trizados_nido || 0) +
      (this.counts.trizados_piso || 0) +
      (this.counts.dobles_nido || 0) +
      (this.counts.dobles_piso || 0);
  }

  private async loadRecord() {
    try {
      if (!this.userId) return;
      const date = this.isoToYmd(this.form.value.date);
      const { farmId, shedId } = this.form.value;
      if (!farmId || !shedId) return;

      this.selectedDate = date;

      const rec = await this.eggsSvc.getOrCreate(farmId, shedId, date, this.userId);
      this.counts = { ...(rec.counts as any) };
      this.form.patchValue({ notes: rec.notes ?? '' }, { emitEvent: false });

      this.calcTotal();
      this.ready = true;
    } catch (e) {
      this.ready = false;
      this.utils.presentToast({ message: 'No se pudo cargar el registro', color: 'danger', duration: 1800 });
      console.error(e);
    }
  }

  async inc(key: EggKey) {
    try {
      const date = this.isoToYmd(this.form.value.date);
      const next = await this.eggsSvc.increment(this.form.value.farmId, this.form.value.shedId, date, key, 1);
      this.counts[key] = next;
      this.calcTotal();
    } catch (e) {
      this.utils.presentToast({ message: 'Error al aumentar', color: 'danger', duration: 1500 });
      console.error(e);
    }
  }

  async dec(key: EggKey) {
    try {
      if ((this.counts[key] || 0) === 0) return;
      const date = this.isoToYmd(this.form.value.date);
      const next = await this.eggsSvc.increment(this.form.value.farmId, this.form.value.shedId, date, key, -1);
      this.counts[key] = next;
      this.calcTotal();
    } catch (e) {
      this.utils.presentToast({ message: 'Error al disminuir', color: 'danger', duration: 1500 });
      console.error(e);
    }
  }

  async onSave() {
    try {
      const date = this.isoToYmd(this.form.value.date);
      await this.eggsSvc.upsertCounts(
        this.form.value.farmId,
        this.form.value.shedId,
        date,
        this.counts,
        this.form.value.notes
      );
      this.utils.presentToast({ message: 'Guardado', color: 'success', duration: 1400 });
    } catch (e) {
      this.utils.presentToast({ message: 'No se pudo guardar', color: 'danger', duration: 1800 });
      console.error(e);
    }
  }
// cerrar sesion

  signOut() {
    this.firebaseSvc.signOut();
  }
}



  

  



  



// import { Component, inject, OnInit } from '@angular/core';
// import { Firebase } from 'src/app/services/firebase';
// import { Utils } from 'src/app/services/utils';

// @Component({
//   selector: 'app-home',
//   templateUrl: './home.page.html',
//   styleUrls: ['./home.page.scss'],
//   standalone: false
// })
// export class HomePage implements OnInit {

//   firebaseSvc = inject(Firebase);
//   utilsSvc = inject(Utils);

//   ngOnInit() {
//   }


//   // cerrar sesion

//   signOut() {
//     this.firebaseSvc.signOut();
//   }

// }