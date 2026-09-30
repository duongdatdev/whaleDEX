export function formatUnits(value: bigint, decimals: number): string {
  const digits = value.toString().padStart(decimals + 1, '0');
  if (decimals === 0) return digits;
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return `${digits.slice(0, -decimals)}${fraction ? `.${fraction}` : ''}`;
}

export function parseUnits(value: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error('Nhập số lượng hợp lệ.');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(`Tối đa ${decimals} chữ số thập phân.`);
  const result = BigInt(`${whole}${fraction.padEnd(decimals, '0')}`);
  if (result <= 0n || result > 18446744073709551615n) throw new Error('Số lượng ngoài giới hạn.');
  return result;
}
