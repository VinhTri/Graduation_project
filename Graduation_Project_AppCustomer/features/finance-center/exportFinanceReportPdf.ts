import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import type { FinanceCenterResponse } from '@/shared/api/services/reportService'
import { formatDeltaPercent, num } from './utils'

type MoneyFormatter = (value: number) => string

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function money(formatMoney: MoneyFormatter, value: unknown) {
  return escapeHtml(formatMoney(num(value)))
}

function metric(label: string, value: string, tone = '') {
  return `<div class="metric ${tone}"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`
}

export function buildFinanceReportHtml(
  data: FinanceCenterResponse,
  formatMoney: MoneyFormatter,
) {
  const generatedAt = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())
  const net = num(data.current.net)
  const walletNet = num(data.current.wallet.net)
  const fundNet = num(data.current.fund.net)
  const budgetRemaining = num(data.budget.remaining)

  return `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page { margin: 28px; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; color: #2f2532; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; line-height: 1.45; }
        .header { padding: 24px; border: 2px solid #482878; border-radius: 22px; color: #fff; background: #57358f; }
        .brand { color: #e8dcff; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; }
        h1 { margin: 5px 0 3px; font-size: 25px; line-height: 1.1; }
        .period { margin: 0; color: #f3edff; font-size: 12px; font-weight: 700; }
        .meta { margin-top: 12px; color: #d9c9f4; font-size: 9px; font-weight: 600; }
        .section { margin-top: 18px; page-break-inside: avoid; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 7px; border-bottom: 2px solid #cdbed5; }
        h2 { margin: 0; font-size: 16px; color: #3d2945; }
        .source { color: #6f6073; font-size: 9px; font-weight: 700; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
        .grid.two { grid-template-columns: repeat(2, 1fr); }
        .metric { min-height: 66px; padding: 12px; border: 1px solid #d8cce0; border-radius: 13px; background: #eee8f3; }
        .metric span { display: block; color: #67586b; font-size: 9px; font-weight: 700; }
        .metric strong { display: block; margin-top: 5px; color: #342839; font-size: 15px; font-weight: 900; }
        .metric.positive { background: #dff2ea; border-color: #b7ddcf; }
        .metric.negative { background: #f8e1e7; border-color: #e9b9c6; }
        .metric.accent { background: #e8def5; border-color: #cdb9e6; }
        .metric.positive strong { color: #087553; }
        .metric.negative strong { color: #b5284d; }
        .metric.accent strong { color: #56318b; }
        .note { margin-top: 9px; padding: 10px 12px; border: 1px solid #cab6e1; border-radius: 11px; color: #4f3c58; background: #e9def5; font-weight: 650; }
        .footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #cdbed5; color: #756779; font-size: 8px; font-weight: 600; text-align: center; }
      </style>
    </head>
    <body>
      <header class="header">
        <div class="brand">SMARTSPEND INSIGHT</div>
        <h1>Báo cáo tài chính cá nhân</h1>
        <p class="period">${escapeHtml(data.currentLabel)}</p>
        <div class="meta">Tạo lúc ${escapeHtml(generatedAt)}</div>
      </header>

      <section class="section">
        <div class="section-head"><h2>1. Tổng quan</h2><span class="source">Ví + Sổ tay</span></div>
        <div class="grid">
          ${metric('Tài sản khả dụng hiện tại', money(formatMoney, data.totalAssets), 'accent')}
          ${metric('Số dư Ví', money(formatMoney, data.walletBalance))}
          ${metric('Số dư Sổ tay', money(formatMoney, data.cashBalance))}
        </div>
        <div class="grid">
          ${metric('Thu thực tế', money(formatMoney, data.current.totalIncome), 'positive')}
          ${metric('Chi thực tế', money(formatMoney, data.current.totalExpense), 'negative')}
          ${metric('Thu–chi ròng', `${net >= 0 ? '+' : '-'}${money(formatMoney, Math.abs(net))}`, net >= 0 ? 'positive' : 'negative')}
        </div>
        <div class="note">Chi tiêu ${escapeHtml(formatDeltaPercent(data.delta.totalExpense.percent, false))} so với ${escapeHtml(data.compareLabel)}.</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>2. Sổ tay</h2><span class="source">Thu và chi thực tế</span></div>
        <div class="grid">
          ${metric('Thu', money(formatMoney, data.current.cash.income), 'positive')}
          ${metric('Chi', money(formatMoney, data.current.cash.expense), 'negative')}
          ${metric('Ròng', money(formatMoney, data.current.cash.net), num(data.current.cash.net) >= 0 ? 'positive' : 'negative')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>3. Ngân sách</h2><span class="source">Các ngân sách giao với kỳ</span></div>
        <div class="grid">
          ${metric('Số ngân sách', escapeHtml(data.budget.activeCount), 'accent')}
          ${metric('Tổng hạn mức', money(formatMoney, data.budget.totalLimit))}
          ${metric('Đã chi', money(formatMoney, data.budget.spent), 'negative')}
          ${metric('Còn lại', `${budgetRemaining < 0 ? '-' : ''}${money(formatMoney, Math.abs(budgetRemaining))}`, budgetRemaining >= 0 ? 'positive' : 'negative')}
          ${metric('Gần hạn mức', escapeHtml(data.budget.atRiskCount))}
          ${metric('Đã vượt', escapeHtml(data.budget.overLimitCount), data.budget.overLimitCount > 0 ? 'negative' : '')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>4. Ví</h2><span class="source">Không gồm giao dịch Quỹ</span></div>
        <div class="grid">
          ${metric('Nạp vào Ví', money(formatMoney, data.current.wallet.income), 'positive')}
          ${metric('Rút khỏi Ví', money(formatMoney, data.current.wallet.expense), 'negative')}
          ${metric('Dòng tiền Ví ròng', `${walletNet >= 0 ? '+' : '-'}${money(formatMoney, Math.abs(walletNet))}`, walletNet >= 0 ? 'positive' : 'negative')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>5. Quỹ</h2><span class="source">Giao dịch do bạn thực hiện</span></div>
        <div class="grid">
          ${metric('Nạp vào Quỹ', money(formatMoney, data.current.fund.income), 'positive')}
          ${metric('Rút khỏi Quỹ', money(formatMoney, data.current.fund.expense), 'negative')}
          ${metric('Dòng tiền Quỹ ròng', `${fundNet >= 0 ? '+' : '-'}${money(formatMoney, Math.abs(fundNet))}`, fundNet >= 0 ? 'positive' : 'negative')}
        </div>
        <div class="note">Nạp/rút Ví và Quỹ là dòng tiền luân chuyển, không tự động được tính là thu nhập hoặc chi tiêu cá nhân.</div>
      </section>

      <footer class="footer">Báo cáo được tạo tự động bởi SmartSpend · Dữ liệu chỉ dùng cho mục đích quản lý chi tiêu cá nhân.</footer>
    </body>
  </html>`
}

export async function exportFinanceReportPdf(
  data: FinanceCenterResponse,
  formatMoney: MoneyFormatter,
) {
  const html = buildFinanceReportHtml(data, formatMoney)

  if (Platform.OS === 'web') {
    await Print.printAsync({ html })
    return
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Báo cáo SmartSpend - ${data.currentLabel}`,
    })
    return
  }

  await Print.printAsync({ html })
}
