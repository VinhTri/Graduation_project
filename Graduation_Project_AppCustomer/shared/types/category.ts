export type CategoryItem = {
  id: number
  label: string
  icon: string
  color: string
  bgColor: string
  groupId: number
  custom: boolean
}

export type CategoryGroup = {
  id: number
  title: string
  icon: string
  color: string
  bgColor: string
  items: CategoryItem[]
}

export type CreateCategoryGroupRequest = {
  title: string
  icon: string
  color: string
  bgColor: string
}

export type CreateCategoryItemRequest = {
  groupId: number
  label: string
  icon: string
  color: string
  bgColor: string
}
