import { Injectable, inject } from '@angular/core';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from '@angular/fire/firestore';
import { Firebase } from './firebase';

// Tipos de huevos
export type EggKey =
  | 'incubables_nido' | 'incubables_piso'
  | 'sucios_nido' | 'sucios_piso'
  | 'trizados_nido' | 'trizados_piso'
  | 'dobles_nido' | 'dobles_piso';

// Estructura del documento
export interface EggRecord {
  date: string;   // YYYY-MM-DD
  farmId: string;
  shedId: string;
  sectorId?: number;
  shedLabel?: string;
  counts: Record<EggKey, number>;
  notes?: string;
  userId: string;       // UID del pollero que hizo el registro
  createdAt?: any;
  updatedAt?: any;
}

// Valores iniciales
const EMPTY_COUNTS: Record<EggKey, number> = {
  incubables_nido: 0, incubables_piso: 0,
  sucios_nido: 0, sucios_piso: 0,
  trizados_nido: 0, trizados_piso: 0,
  dobles_nido: 0, dobles_piso: 0,
};

@Injectable({
  providedIn: 'root'
})
export class Eggs {

  firebase = inject(Firebase);

  // 🔹 Referencia única por galpón + día
  // Un doc por día por galpón: farms/{farmId}/sheds/{shedId}/eggRecords/{date}
  private ref(farmId: string, shedId: string, date: string) {
    const db = getFirestore();
    const docId = date; // único por fecha dentro del galpón
    return doc(db, `farms/${farmId}/sheds/${shedId}/eggRecords/${docId}`);
  }

  // Derivar meta desde shedId (S7B → 7 y B)
  private deriveSectorMeta(shedId: string): { sectorId: number | null; letter: 'A' | 'B' | null; label: string } {
    const m = /^S(\d+)([AB])$/.exec(shedId || '');
    const sectorId = m ? parseInt(m[1], 10) : null;
    const letter = (m ? (m[2] as 'A' | 'B') : null);
    const label = (sectorId && letter) ? `Sector ${sectorId} - Galpón ${letter}` : (shedId || '');
    return { sectorId, letter, label };
  }

  // 🔹 Obtener registro del día (si existe) para ese galpón
  async getDay(
    farmId: string,
    shedId: string,
    date: string
  ): Promise<EggRecord | null> {
    const r = this.ref(farmId, shedId, date);
    const snap = await getDoc(r);
    return snap.exists() ? (snap.data() as EggRecord) : null;
  }

  // 🔹 Guardar o actualizar registro (crear/merge) para ese galpón y día
  async upsertCounts(
    farmId: string,
    shedId: string,
    date: string,
    counts: Partial<Record<EggKey, number>>,
    notes: string | undefined,
    userId: string
  ): Promise<void> {
    const r = this.ref(farmId, shedId, date);
    const meta = this.deriveSectorMeta(shedId);

    await setDoc(
      r,
      {
        date,
        farmId,
        shedId,
        sectorId: meta.sectorId ?? undefined,
        shedLabel: meta.label,
        counts: { ...EMPTY_COUNTS, ...counts },
        ...(notes ? { notes } : {}),
        userId,                      // quién hizo el registro
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  // 🔹 Incrementar o disminuir valores del día en ese galpón
  async increment(
    farmId: string,
    shedId: string,
    date: string,
    key: EggKey,
    delta: number,
    userId: string
  ): Promise<number> {
    const r = this.ref(farmId, shedId, date);
    const snap = await getDoc(r);

    if (!snap.exists()) {
      const meta = this.deriveSectorMeta(shedId);
      const baseCounts = { ...EMPTY_COUNTS, [key]: Math.max(0, delta) };

      const payload: EggRecord = {
        date,
        farmId,
        shedId,
        sectorId: meta.sectorId ?? undefined,
        shedLabel: meta.label,
        counts: baseCounts,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(r, payload);
      return baseCounts[key];
    }

    const current = (snap.data()?.['counts']?.[key] ?? 0) as number;
    const next = Math.max(0, current + delta);

    await updateDoc(r, {
      [`counts.${key}`]: next,
      updatedAt: serverTimestamp()
    });

    return next;
  }

  // 🔹 Listar registros por rango (opcional, para reportes)
  async listByDateRange(
    farmId: string,
    shedId: string,
    startDate: string,
    endDate: string
  ): Promise<EggRecord[]> {
    const db = getFirestore();
    const colRef = collection(db, `farms/${farmId}/sheds/${shedId}/eggRecords`);

    const qRef = query(
      colRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snap = await getDocs(qRef);
    return snap.docs.map(d => d.data() as EggRecord);
  }

  // 🔹 Últimos N días (endDate inclusive)
  async listLastNDays(
    farmId: string,
    shedId: string,
    endDate: string,
    days: number = 7
  ): Promise<EggRecord[]> {
    const start = this.addDays(endDate, -(days - 1));
    return this.listByDateRange(farmId, shedId, start, endDate);
  }

  private addDays(dateYmd: string, offset: number): string {
    const d = new Date(dateYmd + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }
}
