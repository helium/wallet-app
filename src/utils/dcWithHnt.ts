import BN from 'bn.js'

// The wallet's DC plus its HNT valued in DC. It stays loading while a balance
// loads, or while the wallet holds HNT and the HNT oracle price is missing,
// so a missing price never reads as insufficient DC.
export const dcWithHnt = ({
  myDc,
  myHnt,
  hntAsDc,
  loadingMyDc,
  loadingMyHnt,
}: {
  myDc?: bigint
  myHnt?: bigint
  hntAsDc?: BN
  loadingMyDc: boolean
  loadingMyHnt: boolean
}): { myDcWithHnt?: BN; loadingMyDcWithHnt: boolean } => {
  const loadingHntPrice = !!myHnt && myHnt > BigInt(0) && !hntAsDc
  const loadingMyDcWithHnt = loadingMyDc || loadingMyHnt || loadingHntPrice
  return {
    myDcWithHnt: loadingMyDcWithHnt
      ? undefined
      : new BN(myDc?.toString() || '0').add(
          hntAsDc ? hntAsDc.div(new BN(100000000)) : new BN(0),
        ),
    loadingMyDcWithHnt,
  }
}

// True while a cost waits on the HNT price: the total is still loading and
// DC alone does not cover the required DC.
export const waitingOnHntPrice = ({
  loadingMyDcWithHnt,
  myDc,
  requiredDc,
}: {
  loadingMyDcWithHnt: boolean
  myDc?: BN
  requiredDc: BN
}): boolean => loadingMyDcWithHnt && (myDc || new BN(0)).lt(requiredDc)
