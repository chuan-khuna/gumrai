'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  CostListError,
  createCostItem,
  deleteCostItem,
  updateCostItem,
  type CostItemInput,
} from '@/server/cost-items'

// Wiring only: the rules live in @/server/cost-items.

export type CostItemFormState = {
  values: CostItemInput
  error: string | null
}

function readForm(formData: FormData): CostItemInput {
  const text = (key: string) => String(formData.get(key) ?? '')
  // The form's "ไม่มีหมวด" option sends an empty value.
  const categoryId = text('categoryId')
  return {
    name: text('name'),
    unitCost: text('unitCost'),
    unit: text('unit'),
    categoryId: categoryId === '' ? null : categoryId,
  }
}

export async function createCostItemAction(
  _previous: CostItemFormState,
  formData: FormData,
): Promise<CostItemFormState> {
  const values = readForm(formData)
  try {
    await createCostItem(values)
  } catch (error) {
    if (error instanceof CostListError) return { values, error: error.message }
    throw error
  }
  revalidatePath('/cost-list')
  return { values: { name: '', unitCost: '', unit: '', categoryId: null }, error: null }
}

export async function updateCostItemAction(
  id: string,
  _previous: CostItemFormState,
  formData: FormData,
): Promise<CostItemFormState> {
  const values = readForm(formData)
  try {
    await updateCostItem(id, values)
  } catch (error) {
    if (error instanceof CostListError) return { values, error: error.message }
    throw error
  }
  revalidatePath('/cost-list')
  redirect('/cost-list')
}

export async function deleteCostItemAction(id: string): Promise<void> {
  await deleteCostItem(id)
  revalidatePath('/cost-list')
  redirect('/cost-list')
}
