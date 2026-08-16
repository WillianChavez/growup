export type FinancialFlowType =
  | 'operating'
  | 'investing'
  | 'financing'
  | 'transfer'
  | 'reconciliation';

export function isOperatingFlow(flowType: string | null | undefined): boolean {
  return flowType == null || flowType === 'operating';
}
