'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  CostListError,
  saveManualLineToCostList,
  type SavedManualLine,
} from '@/server/cost-items'
import {
  CostSheetError,
  createCostSheet,
  deleteCostSheet,
  duplicateCostSheet,
  renameCostSheet,
  saveCostSheet,
  type CostSheet,
  type CostSheetInput,
  type ManualLineInput,
} from '@/server/cost-sheets'
import { requestClient } from '@/server/request-client'

// Wiring only: the rules live in @/server/cost-sheets and @/server/cost-items.

export type CreateSheetState = { name: string; error: string | null }

export async function createCostSheetAction(
  _previous: CreateSheetState,
  formData: FormData,
): Promise<CreateSheetState> {
  const db = await requestClient()
  const name = String(formData.get('name') ?? '')
  let sheet: CostSheet
  try {
    sheet = await createCostSheet(db, name)
  } catch (error) {
    if (error instanceof CostSheetError) return { name, error: error.message }
    throw error
  }
  revalidatePath('/sheets')
  redirect(`/sheets/${sheet.id}`)
}

export type SaveSheetResult = { sheet: CostSheet; error: null } | { sheet: null; error: string }

export async function saveCostSheetAction(
  id: string,
  input: CostSheetInput,
): Promise<SaveSheetResult> {
  const db = await requestClient()
  try {
    const sheet = await saveCostSheet(db, id, input)
    revalidatePath('/sheets')
    return { sheet, error: null }
  } catch (error) {
    if (error instanceof CostSheetError) return { sheet: null, error: error.message }
    throw error
  }
}

export type SaveLineToListResult = SavedManualLine | { outcome: 'error'; error: string }

export async function saveManualLineToCostListAction(
  line: ManualLineInput,
): Promise<SaveLineToListResult> {
  const db = await requestClient()
  try {
    const saved = await saveManualLineToCostList(db, line)
    if (saved.outcome === 'created') revalidatePath('/cost-list')
    return saved
  } catch (error) {
    if (error instanceof CostListError) return { outcome: 'error', error: error.message }
    throw error
  }
}

export type RenameSheetState = { name: string; error: string | null }

export async function renameCostSheetAction(
  id: string,
  _previous: RenameSheetState,
  formData: FormData,
): Promise<RenameSheetState> {
  const db = await requestClient()
  const name = String(formData.get('name') ?? '')
  try {
    const sheet = await renameCostSheet(db, id, name)
    revalidatePath('/sheets')
    revalidatePath(`/sheets/${id}`)
    return { name: sheet.name, error: null }
  } catch (error) {
    if (error instanceof CostSheetError) return { name, error: error.message }
    throw error
  }
}

// A sheet deleted meanwhile has nothing to copy; the refreshed list no longer shows it.
export async function duplicateCostSheetAction(id: string): Promise<void> {
  const db = await requestClient()
  try {
    await duplicateCostSheet(db, id)
  } catch (error) {
    if (!(error instanceof CostSheetError)) throw error
  }
  revalidatePath('/sheets')
}

export async function deleteCostSheetAction(id: string): Promise<void> {
  const db = await requestClient()
  await deleteCostSheet(db, id)
  revalidatePath('/sheets')
}
