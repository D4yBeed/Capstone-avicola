import { Injectable, inject } from '@angular/core';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, where, orderBy, getDocs, limit
} from '@angular/fire/firestore';
import { Firebase } from './firebase';

// Tipos de huevos
export type EggKey =
  | 'incubables_nido' | 'incubables_piso'
  | 'sucios_nido'     | 'sucios_piso'
  | 'trizados_nido'   | 'trizados_piso'
  | 'dobles_nido'     | 'dobles_piso';

// Estructura de documento en Firestore
export interface EggRecord {
  date: string;   // 'YYYY-MM-DD'
  farmId: string;
  shedId: string;            // ej: S7B
  sectorId?: number;         // Sector 1..7
  shedLabel?: string;        // "Sector 7 - Galpón B"
  counts: Record<EggKey, number>;
  notes?: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

// Valores por defecto
const EMPTY_COUNTS: Record<EggKey, number> = {
  incubables_nido: 0, incubables_piso: 0,
  sucios_nido: 0,     sucios_piso: 0,
  trizados_nido: 0,   trizados_piso: 0,
  dobles_nido: 0,     dobles_piso: 0,
};

@Injectable({
  providedIn: 'root'
})
export class Eggs {

  firebase = inject(Firebase);

  // 🔹 Referencia al documento en Firestore
  private ref(farmId: string, shedId: string, date: string) {
    const db = getFirestore();
    return doc(db, `farms/${farmId}/sheds/${shedId}/eggRecords/${date}`);
  }

  // 🔹 Derivar sector y letra desde shedId (ej: S7B → 7 y B)
  private deriveSectorMeta(shedId: string): { sectorId: number | null; letter: 'A' | 'B' | null; label: string } {
    const m = /^S(\d+)([AB])$/.exec(shedId || '');
    const sectorId = m ? parseInt(m[1], 10) : null;
    const letter = (m ? (m[2] as 'A' | 'B') : null);
    const label = (sectorId && letter) ? `Sector ${sectorId} - Galpón ${letter}` : (shedId || '');
    return { sectorId, letter, label };
  }

  // 🔹 Crear documento si no existe
  async getOrCreate(farmId: string, shedId: string, date: string, userId: string): Promise<EggRecord> {
    const r = this.ref(farmId, shedId, date);
    const snap = await getDoc(r);
    if (snap.exists()) return snap.data() as EggRecord;

    const meta = this.deriveSectorMeta(shedId);
    const payload: EggRecord = {
      date,
      farmId,
      shedId,
      sectorId: meta.sectorId ?? undefined,
      shedLabel: meta.label,
      counts: { ...EMPTY_COUNTS },
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(r, payload, { merge: true });
    return payload;
  }

  // 🔹 Obtener registro existente
  async getDay(farmId: string, shedId: string, date: string) {
    const snap = await getDoc(this.ref(farmId, shedId, date));
    return snap.exists() ? (snap.data() as EggRecord) : null;
  }

  // 🔹 Guardar conteos y notas (crea si no existe)
  async upsertCounts(
    farmId: string,
    shedId: string,
    date: string,
    counts: Partial<Record<EggKey, number>>,
    notes?: string
  ): Promise<void> {
    const r = this.ref(farmId, shedId, date);
    const meta = this.deriveSectorMeta(shedId);

    await setDoc(r, {
      date: date.toString(),
      farmId,
      shedId,
      sectorId: meta.sectorId ?? undefined,
      shedLabel: meta.label,
      counts: { ...EMPTY_COUNTS, ...counts },
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: serverTimestamp()
    } as any, { merge: true });
  }

  // 🔹 Incrementar o disminuir categoría
  async increment(
    farmId: string,
    shedId: string,
    date: string,
    key: EggKey,
    delta: number
  ): Promise<number> {
    const r = this.ref(farmId, shedId, date);
    const meta = this.deriveSectorMeta(shedId);
    const snap = await getDoc(r);

    if (!snap.exists()) {
      const baseCounts = { ...EMPTY_COUNTS, [key]: Math.max(0, delta) };
      await setDoc(r, {
        date: date.toString(),
        farmId,
        shedId,
        sectorId: meta.sectorId ?? undefined,
        shedLabel: meta.label,
        counts: baseCounts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      } as any, { merge: true });
      return baseCounts[key];
    }

    const current = (snap.data()?.['counts']?.[key] ?? 0) as number;
    const next = Math.max(0, current + delta);

    await updateDoc(r, {
      [`counts.${key}`]: next,
      updatedAt: serverTimestamp()
    } as any);

    return next;
  }

  // 🔹 Obtener registros por rango (para reportes / historial)
  async listByDateRange(
    farmId: string,
    shedId: string,
    startDate: string,
    endDate: string
  ): Promise<EggRecord[]> {
    const db = getFirestore();
    const colRef = collection(db, `farms/${farmId}/sheds/${shedId}/eggRecords`);

    // ✅ Filtrar correctamente por rango de fecha (campo string)
    const q = query(
      colRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data() as EggRecord);
    } catch (error) {
      console.error('🔥 Error en listByDateRange:', error);
      throw error;
    }
  }

  // 🔹 Obtener últimos N días (por defecto 7)
  async listLastNDays(
    farmId: string,
    shedId: string,
    endDate: string,
    days: number = 7
  ): Promise<EggRecord[]> {
    const start = this.addDays(endDate, -(days - 1));
    return this.listByDateRange(farmId, shedId, start, endDate);
  }

  // 🔹 Utilidad para sumar/restar días
  private addDays(dateYmd: string, offset: number): string {
    const d = new Date(dateYmd + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

}
