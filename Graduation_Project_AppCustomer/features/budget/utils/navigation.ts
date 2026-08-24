import type { Router } from 'expo-router'

/** Về màn trước (list ngân sách / danh mục) — tránh replace làm lặp trang. */
export function navigateBackToBudgetList(router: Router) {
  if (router.canGoBack()) {
    router.back()
    return
  }
  if (router.canDismiss()) {
    router.dismissTo('/budget')
    return
  }
  router.replace('/budget')
}
