export const solanaDerivation = (account = -1, change: number | undefined) => {
  if (account === -1) {
    return "m/44'/501'" // main derivation path
  }
  if (typeof change !== 'undefined') {
    return `m/44'/501'/${account}'/${change}'` // sub derivation path
  }
  return `m/44'/501'/${account}'` // sub derivation path
}

export const heliumDerivation = (account = -1) => {
  if (account === -1) {
    return "m/44'/904'" // main derivation path
  }
  return `m/44'/904'/${account}'/0'` // sub derivation path
}

export const solanaWithChange = (start: number, end: number) =>
  new Array(end - start).fill(0).map((_, i) => solanaDerivation(i + start, 0))

export const solanaWithoutChange = (start: number, end: number) =>
  new Array(end - start)
    .fill(0)
    .map((_, i) => solanaDerivation(i + start, undefined))

export const HELIUM_DERIVATION = 'Helium L1'
export const MAIN_DERIVATION_PATHS = [
  HELIUM_DERIVATION,
  heliumDerivation(-1),
  heliumDerivation(0),
  solanaDerivation(-1, undefined),
]
