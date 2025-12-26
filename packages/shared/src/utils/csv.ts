export const REQUIRED_MILES_COLUMNS = [
  'Authorised on',
  'Processed on',
  'Amount',
  'Currency',
  'Description',
  'Payment type',
  'Status'
];

export function validateMilesHeader(header: string[]): string[] {
  return REQUIRED_MILES_COLUMNS.filter((column) => !header.includes(column));
}
