import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

export async function fetchUsDebtData(): Promise<SourceResult> {
  try {
    const [currentResult, previousResult, breakdownResult] = await Promise.all([
      safeFetchJSON<any>(
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?page[size]=1&sort=-record_date',
        undefined,
        15_000,
      ),
      safeFetchJSON<any>(
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?page[size]=2&sort=-record_date',
        undefined,
        15_000,
      ),
      safeFetchJSON<any>(
        'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_outstanding?page[size]=1&sort=-record_date',
        undefined,
        15_000,
      ),
    ]);

    const currentData = currentResult.data ?? currentResult;
    const currentEntry = Array.isArray(currentData) ? currentData[0] : currentData;

    const totalDebt = parseFloat(
      currentEntry?.total_public_debt_outstanding ??
      currentEntry?.debt_to_penny ??
      currentEntry?.totalDebt ??
      '0',
    );

    let dailyChange = 0;
    const prevData = previousResult.data ?? previousResult;
    if (Array.isArray(prevData) && prevData.length >= 2) {
      const todayDebt = parseFloat(
        prevData[0]?.total_public_debt_outstanding ??
        prevData[0]?.debt_to_penny ??
        prevData[0]?.totalDebt ??
        '0',
      );
      const yesterdayDebt = parseFloat(
        prevData[1]?.total_public_debt_outstanding ??
        prevData[1]?.debt_to_penny ??
        prevData[1]?.totalDebt ??
        '0',
      );
      dailyChange = todayDebt - yesterdayDebt;
    }

    const debtByType: { type: string; amount: number }[] = [];
    if (currentEntry) {
      const intragov = parseFloat(
        currentEntry?.intragovernmental_holdings ??
        currentEntry?.intragovernment ??
        '0',
      );
      const publicDebt = parseFloat(
        currentEntry?.debt_held_by_the_public ??
        currentEntry?.publicDebt ??
        '0',
      );
      if (intragov > 0) debtByType.push({ type: 'Intragovernmental Holdings', amount: intragov });
      if (publicDebt > 0) debtByType.push({ type: 'Debt Held by the Public', amount: publicDebt });
    }

    if (debtByType.length === 0) {
      const bdData = breakdownResult.data ?? breakdownResult;
      if (Array.isArray(bdData) && bdData[0]) {
        const bd = bdData[0];
        const totalOut = parseFloat(bd?.total_public_debt_outstanding ?? bd?.debt_to_penny ?? '0');
        if (totalOut > 0) {
          debtByType.push({ type: 'Total Public Debt Outstanding', amount: totalOut });
        }
      }
    }

    const lastUpdated = currentEntry?.record_date ?? currentEntry?.date ?? '';

    return {
      name: 'us-debt', source: 'us-debt',
      success: true,
      data: { totalDebt, debtByType, lastUpdated, dailyChange },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'us-debt', source: 'us-debt',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
