function cleanCategoryName(name?: string | null) {
  return (name ?? '').replace(/\s*\(đã xóa\)\s*$/i, '').trim()
}

export function isFundDepositCategory(name?: string | null) {
  return cleanCategoryName(name) === 'Nạp quỹ'
}

export function isFundWithdrawCategory(name?: string | null) {
  return cleanCategoryName(name) === 'Rút quỹ'
}

export function isFundWalletHistory(name?: string | null) {
  return isFundDepositCategory(name) || isFundWithdrawCategory(name)
}

export function isSplitCategory(name?: string | null) {
  return cleanCategoryName(name) === 'Chia tiền'
}

export function isTransferOutCategory(name?: string | null) {
  return cleanCategoryName(name) === 'Chuyển tiền'
}

export function isTransferInCategory(name?: string | null) {
  return cleanCategoryName(name) === 'Nhận chuyển tiền'
}

export function isInternalTransferHistory(name?: string | null, note?: string | null) {
  return (
    isTransferOutCategory(name) ||
    isTransferInCategory(name) ||
    /Chuyển tiền đến "/.test(note ?? '') ||
    /Nhận chuyển tiền từ "/.test(note ?? '')
  )
}

export function isSplitWalletHistory(name?: string | null, note?: string | null) {
  return isSplitCategory(name) || /chia tiền "/i.test(note ?? '')
}

export function isStructuredWalletHistory(name?: string | null, note?: string | null) {
  return isFundWalletHistory(name) || isSplitWalletHistory(name, note) || isInternalTransferHistory(name, note)
}

export function parseFundNameFromNote(note?: string | null) {
  if (!note) return null
  const match = note.match(/quỹ "([^"]+)"/i)
  const name = match?.[1]?.trim()
  return name || null
}

function parseQuoted(note: string | null | undefined, pattern: RegExp) {
  if (!note) return null
  const match = note.match(pattern)
  const value = match?.[1]?.trim()
  return value || null
}

export function walletHistoryUserNote(note?: string | null, categoryName?: string | null) {
  if (!note?.trim()) return null
  if (!isStructuredWalletHistory(categoryName, note)) return note.trim()
  const parts = note.split(' — ')
  if (parts.length < 2) return null
  return parts.slice(1).join(' — ').trim() || null
}

export function shouldShowWalletHistoryDestination(
  categoryName?: string | null,
  note?: string | null,
) {
  return isStructuredWalletHistory(categoryName, note)
}

export function walletHistoryDestination(input: {
  categoryName?: string | null
  note?: string | null
  type?: string | null
  bankName?: string | null
  fromHistory?: boolean
}) {
  const fundName = parseFundNameFromNote(input.note)
  if (isFundDepositCategory(input.categoryName)) {
    return fundName
      ? `Ví SmartSpend đến quỹ (${fundName})`
      : 'Ví SmartSpend đến quỹ'
  }
  if (isFundWithdrawCategory(input.categoryName)) {
    return fundName
      ? `${fundName} nạp vào ví SmartSpend`
      : 'Nạp vào ví SmartSpend'
  }

  const splitTitle = parseQuoted(input.note, /chia tiền "([^"]+)"/i)
  const splitToPeer = parseQuoted(input.note, /chia tiền "[^"]+" cho "([^"]+)"/i)
  const splitFromPeer = parseQuoted(input.note, /chia tiền "[^"]+" từ "([^"]+)"/i)
  const isSplitOut =
    (isSplitCategory(input.categoryName) && input.type !== 'TOP_UP') || !!splitToPeer
  const isSplitIn =
    (isSplitCategory(input.categoryName) && input.type === 'TOP_UP') || !!splitFromPeer

  if (isSplitOut) {
    if (splitToPeer && splitTitle) return `Ví SmartSpend đến ${splitToPeer} (${splitTitle})`
    if (splitToPeer) return `Ví SmartSpend đến ${splitToPeer}`
    return 'Thanh toán chia tiền'
  }
  if (isSplitIn) {
    if (splitFromPeer && splitTitle) return `${splitFromPeer} nạp vào ví SmartSpend (${splitTitle})`
    if (splitFromPeer) return `${splitFromPeer} nạp vào ví SmartSpend`
    return 'Nhận chia tiền'
  }

  const transferToPeer = parseQuoted(input.note, /Chuyển tiền đến "([^"]+)"/)
  const transferFromPeer = parseQuoted(input.note, /Nhận chuyển tiền từ "([^"]+)"/)
  const isTransferOut =
    (isTransferOutCategory(input.categoryName) && input.type !== 'TOP_UP') || !!transferToPeer
  const isTransferIn =
    (isTransferInCategory(input.categoryName) && input.type === 'TOP_UP') || !!transferFromPeer

  if (isTransferOut) {
    return transferToPeer ? `Ví SmartSpend đến ${transferToPeer}` : 'Chuyển tiền nội bộ'
  }
  if (isTransferIn) {
    return transferFromPeer
      ? `${transferFromPeer} nạp vào ví SmartSpend`
      : 'Nhận chuyển tiền'
  }

  if (input.type !== 'TOP_UP') {
    if (input.fromHistory) return 'Rút từ Ví SmartSpend'
    const bank = input.bankName?.trim()
    return bank ? `Ví SmartSpend đến (${bank})` : 'Rút từ Ví SmartSpend'
  }
  return 'Nạp vào Ví SmartSpend'
}
