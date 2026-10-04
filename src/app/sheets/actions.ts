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
  saveCostSheet,
  type CostSheet,
  type CostSheetInput,
  type ManualLineInput,
} from '@/server/cost-sheets'

// Wiring only: the rules live in @/server/cost-sheets and @/server/cost-items.

export type CreateSheetState = { name: string; error: string | null }

export async function createCostSheetAction(
  _previous: CreateSheetState,
  formData: FormData,
): Promise<CreateSheetState> {
  const name = String(formData.get('name') ?? '')
  let sheet: CostSheet
  try {
    sheet = await createCostSheet(name)
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
  try {
    const sheet = await saveCostSheet(id, input)
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
  try {
    const saved = await saveManualLineToCostList(line)
    if (saved.outcome === 'created') revalidatePath('/cost-list')
    return saved
  } catch (error) {
    if (error instanceof CostListError) return { outcome: 'error', error: error.message }
    throw error
  }
}
