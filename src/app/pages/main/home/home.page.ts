import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { onAuthStateChanged } from 'firebase/auth';

import { Eggs, EggKey } from 'src/app/services/eggs';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';

type Shed = { id: string; name: string; sector: number; letter: 'A' | 'B' };

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  form!: FormGroup;
  user!: User;
  userId: string | null = null;
  ready = false;

  selectedDate = ''; // YYYY-MM-DD
  totalDia = 0;

  farms = [{ id: 'ELMOLLE', name: 'Granja El Molle' }];

  sectors = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Sector ${i + 1}` }));

  allSheds: Shed[] = Array.from({ length: 7 }, (_, i) => i + 1).reduce((acc, sector) => {
    (['A', 'B'] as ('A' | 'B')[]).forEach(letter => {
      acc.push({
        id: `S${sector}${letter}`,
        name: `Sector ${sector} - Galpón ${letter}`,
        sector,
        letter
      });
    });
    return acc;
  }, [] as Shed[]);

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

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);
  eggsSvc = inject(Eggs);
  fb = inject(FormBuilder);

  ngOnInit(): void {
    this.user = this.utilsSvc.getFromLocalStorage('user');

    const todayISO = this.todayLocalISO();
    this.selectedDate = todayISO.slice(0, 10);

    // Filtro inicial según el rol del usuario
    this.sheds = this.filterShedsByRole();

    const defaultSector = this.sheds[0]?.sector || 1;

    this.form = this.fb.group({
      date: [todayISO],
      farmId: [this.farms[0]?.id || ''],
      sectorId: [defaultSector],
      shedId: [this.sheds[0]?.id || ''],
      notes: ['']
    });

    // Solo encargados o supervisores pueden cambiar sector/galpón
    if (this.user.role !== 'pollero') {
      this.form.get('sectorId')!.valueChanges.subscribe((sec: number) => {
        this.sheds = this.allSheds.filter(s => s.sector === Number(sec));
        this.form.patchValue({ shedId: this.sheds[0]?.id || '' }, { emitEvent: false });
        this.loadRecord();
      });
    }

    // Carga inicial del registro del día
    onAuthStateChanged(this.firebaseSvc.getAuth(), async (u) => {
      this.userId = u?.uid ?? null;
      if (this.userId) {
        await this.loadRecord();
        if (this.user.role !== 'pollero') {
          this.form.get('farmId')!.valueChanges.subscribe(() => this.loadRecord());
          this.form.get('shedId')!.valueChanges.subscribe(() => this.loadRecord());
        }
      } else {
        this.ready = false;
      }
    });
  }

  // 🧩 Filtra los galpones según el rol
  private filterShedsByRole(): Shed[] {
    if (!this.user) return this.allSheds;

    if (this.user.role === 'pollero' && this.user.assignedShed) {
      // ✅ El pollero solo ve su galpón asignado
      const shed = this.allSheds.find(s => s.id === this.user.assignedShed);
      return shed ? [shed] : [];
    }

    // ✅ Supervisores y encargados ven todo
    return this.allSheds;
  }

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
    this.totalDia = Object.values(this.counts).reduce((a, b) => a + b, 0);
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
      this.utilsSvc.presentToast({ message: 'No se pudo cargar el registro', color: 'danger', duration: 1800 });
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
      this.utilsSvc.presentToast({ message: 'Error al aumentar', color: 'danger', duration: 1500 });
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
      this.utilsSvc.presentToast({ message: 'Error al disminuir', color: 'danger', duration: 1500 });
      console.error(e);
    }
  }

  async onSave() {
  try {
    const date = this.isoToYmd(this.form.value.date);
    const { farmId, shedId } = this.form.value;

    // Verificar si ya existe un registro del mismo día y galpón
    const existing = await this.eggsSvc.getDay(farmId, shedId, date);

    if (existing) {
      this.utilsSvc.presentToast({
        message: 'Ya existe un registro para este día y galpón.',
        color: 'warning',
        duration: 2500,
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return; // Evita guardar otro registro
    }

    // Si no existe, guardar normalmente
    await this.eggsSvc.upsertCounts(
      farmId,
      shedId,
      date,
      this.counts,
      this.form.value.notes
    );

    this.utilsSvc.presentToast({
      message: 'Registro guardado exitosamente',
      color: 'success',
      duration: 1800,
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });

  } catch (e) {
    console.error(e);
    this.utilsSvc.presentToast({
      message: 'No se pudo guardar el registro',
      color: 'danger',
      duration: 2000,
      position: 'middle',
      icon: 'alert-circle-outline'
    });
  }
}


  signOut() {
    this.firebaseSvc.signOut();
  }
}
