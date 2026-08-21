import { Redirect } from 'expo-router'

/** PIN hủy liên kết đã chuyển sang PinModal nửa màn trên BankBindingScreen. */
export default function UnlinkBankPinPage() {
  return <Redirect href="/settings/bank-binding" />
}
