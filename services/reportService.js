import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { requireCurrentHousehold } from './householdService';
import { formatCurrency } from '../utils/currency';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatReportDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMonthLabel(value) {
  if (!value) return 'Unknown month';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Unknown month';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getReportFileName(monthReference) {
  if (!monthReference) return 'billguard-report.pdf';
  const date = new Date(`${monthReference}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'billguard-report.pdf';

  const month = date
    .toLocaleDateString('en-US', { month: 'short' })
    .toLowerCase();
  const year = date.getFullYear();

  return `billguard-report-${month}-${year}.pdf`;
}

function buildPaymentsRows(payments, currencyCode) {
  return payments
    .map(
      (payment) => `
        <tr>
          <td>${escapeHtml(payment.billName)}</td>
          <td>${escapeHtml(formatReportDate(payment.paidAt))}</td>
          <td>${escapeHtml(payment.paidByLabel)}</td>
          <td class="amount">${escapeHtml(formatCurrency(payment.amount, currencyCode))}</td>
        </tr>
      `
    )
    .join('');
}

function buildPayerRows(payments, currencyCode) {
  const totals = payments.reduce((map, payment) => {
    const key = payment.paidByLabel || 'Unnamed member';
    map.set(key, (map.get(key) ?? 0) + Number(payment.amount || 0));
    return map;
  }, new Map());

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(
      ([payer, total]) => `
        <tr>
          <td>${escapeHtml(payer)}</td>
          <td class="amount">${escapeHtml(formatCurrency(total, currencyCode))}</td>
        </tr>
      `
    )
    .join('');
}

function buildMonthlyPaymentsReportHtml({
  householdName,
  monthReference,
  payments,
  currencyCode,
}) {
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const generatedAt = formatReportDate(new Date().toISOString());
  const uniquePayers = new Set(payments.map((payment) => payment.paidByLabel)).size;
  const reportFileName = getReportFileName(monthReference);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(reportFileName)}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 16mm;
          }
          html {
            background: #ffffff;
          }
          body {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            color: #111111;
            background: #ffffff;
            line-height: 1.4;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          .report {
            width: 100%;
          }
          .report-title {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.4px;
            margin-bottom: 4px;
          }
          .report-subtitle {
            font-size: 12px;
            color: #555555;
            margin-bottom: 18px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .meta-table td {
            border: none;
            padding: 4px 0;
            font-size: 12px;
          }
          .meta-label {
            width: 120px;
            color: #555555;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .summary-table td {
            width: 33.33%;
            border: 1px solid #cfcfcf;
            padding: 10px 12px;
            vertical-align: top;
          }
          .summary-label {
            color: #555555;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: 700;
          }
          .section {
            margin-top: 18px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #222222;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #444444;
            padding: 8px 6px;
            border-bottom: 1px solid #999999;
          }
          td {
            padding: 8px 6px;
            border-bottom: 1px solid #dddddd;
            vertical-align: top;
            font-size: 12px;
          }
          .amount {
            text-align: right;
            white-space: nowrap;
            font-weight: 700;
          }
          .footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #cfcfcf;
            color: #555555;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <h1 class="report-title">Monthly Payment Report</h1>
          <p class="report-subtitle">BillGuard household payment summary</p>

          <table class="meta-table" role="presentation">
            <tr>
              <td class="meta-label">Household</td>
              <td>${escapeHtml(householdName)}</td>
            </tr>
            <tr>
              <td class="meta-label">Reporting month</td>
              <td>${escapeHtml(formatMonthLabel(monthReference))}</td>
            </tr>
            <tr>
              <td class="meta-label">Generated on</td>
              <td>${escapeHtml(generatedAt)}</td>
            </tr>
          </table>

          <table class="summary-table" role="presentation">
            <tr>
              <td>
                <div class="summary-label">Total Paid</div>
                <div class="summary-value">${escapeHtml(formatCurrency(totalAmount, currencyCode))}</div>
              </td>
              <td>
                <div class="summary-label">Payments Recorded</div>
                <div class="summary-value">${payments.length}</div>
              </td>
              <td>
                <div class="summary-label">Members With Payments</div>
                <div class="summary-value">${uniquePayers}</div>
              </td>
            </tr>
          </table>

          <div class="section">
            <h2 class="section-title">Payment Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Date Paid</th>
                  <th>Recorded By</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${buildPaymentsRows(payments, currencyCode)}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Totals by Member</h2>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th class="amount">Total Paid</th>
                </tr>
              </thead>
              <tbody>
                ${buildPayerRows(payments, currencyCode)}
              </tbody>
            </table>
          </div>

          <p class="footer">
            Prepared from recorded payments in BillGuard. This report reflects the selected month only.
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function shareMonthlyPaymentsReport({ monthReference, payments, currencyCode }) {
  if (!monthReference) {
    throw new Error('Choose a month before exporting a report.');
  }

  if (!payments?.length) {
    throw new Error('No payments are available for the selected month.');
  }

  const { householdName } = await requireCurrentHousehold();
  const reportFileName = getReportFileName(monthReference);
  const html = buildMonthlyPaymentsReportHtml({
    householdName,
    monthReference,
    payments,
    currencyCode,
  });

  if (Platform.OS === 'web') {
    await new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '-10000px';
      iframe.style.width = '794px';
      iframe.style.height = '1123px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('aria-hidden', 'true');

      const cleanup = () => {
        window.setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      };

      document.body.appendChild(iframe);
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        reject(new Error('Could not open printable report frame.'));
        return;
      }

      frameWindow.document.open();
      frameWindow.document.write(html);
      frameWindow.document.close();

      window.setTimeout(() => {
        try {
          frameWindow.document.title = reportFileName;
          frameWindow.focus();
          frameWindow.print();
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      }, 250);
    });

    return null;
  }

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const targetUri = directory ? `${directory}${reportFileName}` : uri;

  let shareUri = uri;
  if (targetUri && targetUri !== uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetUri, { idempotent: true });
      }

      await FileSystem.moveAsync({
        from: uri,
        to: targetUri,
      });
      shareUri = targetUri;
    } catch {
      shareUri = uri;
    }
  }

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(shareUri, {
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf',
  });

  return shareUri;
}
