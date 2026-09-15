/** Flag tạm: sau setup PIN lần đầu → Home hiện modal thành công. */
let pendingPinSetupSuccessModal = false

export function markPinSetupSuccessPending() {
  pendingPinSetupSuccessModal = true
}

export function consumePinSetupSuccessPending(): boolean {
  const pending = pendingPinSetupSuccessModal
  pendingPinSetupSuccessModal = false
  return pending
}
