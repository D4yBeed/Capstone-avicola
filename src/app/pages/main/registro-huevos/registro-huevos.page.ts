
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { onAuthStateChanged } from 'firebase/auth';

import { Eggs, EggKey } from 'src/app/services/eggs';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { User } from 'src/app/models/user.model';

type Shed = { id: string; name: string; sector: number; letter: 'A' | 'B' };
@Component({
  selector: 'app-registro-huevos',
  templateUrl: './registro-huevos.page.html',
  styleUrls: ['./registro-huevos.page.scss'],
  standalone: false
})
export class RegistroHuevosPage implements OnInit {

  form!: FormGroup;
    user!: User;
    userId: string | null = null;  // UID de Firebase (y también de tu User)
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

    // 1. Filtrar Galpones (ya lo tenías)
    this.sheds = this.filterShedsByRole();
    
    // 🔹 2. NUEVO: Filtrar Sectores si es pollero
    if (this.user.role === 'pollero' && this.user.assignedShed) {
      // Extraemos el número del galpón (ej: "S3A" -> "3")
      // Usamos una expresión regular para sacar solo los dígitos
      const sectorNumString = this.user.assignedShed.replace(/\D/g, ''); 
      const sectorNum = parseInt(sectorNumString, 10);

      if (!isNaN(sectorNum)) {
        // Sobrescribimos la lista de sectores para mostrar SOLO el asignado
        this.sectors = [{ id: sectorNum, name: `Sector ${sectorNum}` }];
      }
    }

    // Seleccionar sector por defecto (el primero de la lista filtrada o completa)
    const defaultSector = this.sectors.length > 0 ? this.sectors[0].id : 1;

    this.form = this.fb.group({
      date: [todayISO],
      farmId: [this.farms[0]?.id || ''],
      sectorId: [defaultSector], // 🔹 Se pre-selecciona el sector único si es pollero
      shedId: [this.sheds[0]?.id || ''],
      notes: ['']
    });

    // Lógica de cambio de sector (Solo si NO es pollero, o si quieres que funcione igual)
    if (this.user.role !== 'pollero') {
      this.form.get('sectorId')!.valueChanges.subscribe((sec: number) => {
        this.sheds = this.allSheds.filter(s => s.sector === Number(sec));
        this.form.patchValue({ shedId: this.sheds[0]?.id || '' }, { emitEvent: false });
        this.loadRecord();
      });
    } else {
        // Si es pollero, como solo hay un sector y galpón, cargamos directo
        this.loadRecord(); 
    }
  
      onAuthStateChanged(this.firebaseSvc.getAuth(), async (u) => {
        this.userId = u?.uid ?? null;
        if (this.userId) {
          await this.loadRecord();
        } else {
          this.ready = false;
        }
      });
    }
  
    private filterShedsByRole(): Shed[] {
      if (!this.user) return this.allSheds;
  
      if (this.user.role === 'pollero' && this.user.assignedShed) {
        const shed = this.allSheds.find(s => s.id === this.user.assignedShed);
        return shed ? [shed] : [];
      }
  
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
  
    // 🔹 Cargar registro del día (sin crear automático)
    private async loadRecord() {
      try {
        if (!this.userId) return;
        const date = this.isoToYmd(this.form.value.date);
        const { farmId, shedId } = this.form.value;
        if (!farmId || !shedId) return;
  
        this.selectedDate = date;
  
        // 👀 Obtener registro por galpón + día
        const rec = await this.eggsSvc.getDay(farmId, shedId, date);
  
        // Si ya existe un registro en este galpón y el usuario es pollero, bloquear edición
        if (rec && this.user.role === 'pollero') {
          this.counts = { ...(rec.counts as any) };
          this.form.patchValue({ notes: rec.notes ?? '' }, { emitEvent: false });
          this.calcTotal();
          this.ready = true;
  
          this.form.disable();
  
          this.utilsSvc.presentToast({
            message: 'Ya existe un registro para este galpón en este día. No puedes modificarlo.',
            color: 'warning',
            duration: 2500,
            position: 'middle',
            icon: 'alert-circle-outline'
          });
          return;
        }
  
        // Si no hay registro previo en este galpón+día, trabajar en blanco
        if (!rec) {
          this.counts = {
            incubables_nido: 0, incubables_piso: 0,
            sucios_nido: 0, sucios_piso: 0,
            trizados_nido: 0, trizados_piso: 0,
            dobles_nido: 0, dobles_piso: 0,
          };
          this.form.patchValue({ notes: '' }, { emitEvent: false });
        } else {
          // Para otros roles (supervisor/encargado) podrías permitir edición si quisieras
          this.counts = { ...(rec.counts as any) };
          this.form.patchValue({ notes: rec.notes ?? '' }, { emitEvent: false });
        }
  
        this.calcTotal();
        this.ready = true;
      } catch (e) {
        this.ready = false;
        this.utilsSvc.presentToast({
          message: 'No se pudo cargar el registro',
          color: 'danger',
          duration: 1800
        });
        console.error(e);
      }
    }
  
    async inc(key: EggKey) {
      try {
        if (this.form.disabled) return;
  
        const date = this.isoToYmd(this.form.value.date);
        const next = await this.eggsSvc.increment(
          this.form.value.farmId,
          this.form.value.shedId,
          date,
          key,
          1,
          this.userId!
        );
        this.counts[key] = next;
        this.calcTotal();
      } catch (e) {
        this.utilsSvc.presentToast({ message: 'Error al aumentar', color: 'danger', duration: 1500 });
        console.error(e);
      }
    }
  
    async dec(key: EggKey) {
      try {
        if (this.form.disabled) return;
        if ((this.counts[key] || 0) === 0) return;
  
        const date = this.isoToYmd(this.form.value.date);
        const next = await this.eggsSvc.increment(
          this.form.value.farmId,
          this.form.value.shedId,
          date,
          key,
          -1,
          this.userId!
        );
        this.counts[key] = next;
        this.calcTotal();
      } catch (e) {
        this.utilsSvc.presentToast({ message: 'Error al disminuir', color: 'danger', duration: 1500 });
        console.error(e);
      }
    }
  
    onCountChange(key: EggKey, rawValue: string | null) {
    if (this.form.disabled) return;
  
    const num = Number(rawValue ?? 0);
  
    // Si no es número o es negativo, lo dejamos en 0
    const safe = isNaN(num) || num < 0 ? 0 : Math.floor(num);
  
    this.counts[key] = safe;
    this.calcTotal();
  }
  
  
    async onSave() {
      try {
        const date = this.isoToYmd(this.form.value.date);
        const { farmId, shedId, notes } = this.form.value;
  
        if (!this.userId) {
          this.utilsSvc.presentToast({
            message: 'Usuario no identificado',
            color: 'danger',
            duration: 2000,
            position: 'middle'
          });
          return;
        }
  
        // Ver si ya existe algún registro para este galpón y día
        const existing = await this.eggsSvc.getDay(farmId, shedId, date);
  
        // Crear o actualizar SIEMPRE (en este galpón + día)
        await this.eggsSvc.upsertCounts(
          farmId,
          shedId,
          date,
          this.counts,
          notes,
          this.userId
        );
  
        this.utilsSvc.presentToast({
          message: existing
            ? 'Registro actualizado correctamente'
            : 'Registro guardado exitosamente',
          color: 'success',
          duration: 1800,
          position: 'middle',
          icon: 'checkmark-circle-outline'
      });
  
        // Si es pollero, bloquear edición después de guardar su registro
        if (this.user.role === 'pollero') {
          this.form.disable();
        }
  
      } catch (error) {
        console.error(error);
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
