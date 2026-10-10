'use server'

import { revalidatePath } from 'next/cache'
import {
  CostCategoryError,
  createCostCategory,
  deleteCostCategory,
  renameCostCategory,
} from '@/server/costs/cost-categories'
import { requestClient } from '@/server/db/request-client'

// Wiring only: the rules live in @/server/costs/cost-categories.

export type CategoryFormState = {
  name: string
  error: string | null
}

function revalidate() {
  revalidatePath('/cost-list')
  revalidatePath('/cost-list/categories')
}

export async function createCostCategoryAction(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const db = await requestClient()
  const name = String(formData.get('name') ?? '')
  try {
    await createCostCategory(db, name)
  } catch (error) {
    if (error instanceof CostCategoryError) return { name, error: error.message }
    throw error
  }
  revalidate()
  return { name: '', error: null }
}

export async function renameCostCategoryAction(
  id: string,
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const db = await requestClient()
  const name = String(formData.get('name') ?? '')
  try {
    const renamed = await renameCostCategory(db, id, name)
    revalidate()
    return { name: renamed.name, error: null }
  } catch (error) {
    if (error instanceof CostCategoryError) return { name, error: error.message }
    throw error
  }
}

export async function deleteCostCategoryAction(id: string): Promise<void> {
  const db = await requestClient()
  await deleteCostCategory(db, id)
  revalidate()
}
