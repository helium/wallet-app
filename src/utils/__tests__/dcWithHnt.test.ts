import BN from 'bn.js'
import { dcWithHnt, waitingOnHntPrice } from '../dcWithHnt'

const loaded = { loadingMyDc: false, loadingMyHnt: false }

describe('dcWithHnt', () => {
  it('is loading while the wallet holds HNT and the HNT price is missing', () => {
    const result = dcWithHnt({
      ...loaded,
      myDc: BigInt(5),
      myHnt: BigInt(100),
      hntAsDc: undefined,
    })
    expect(result.loadingMyDcWithHnt).toBe(true)
    expect(result.myDcWithHnt).toBeUndefined()
  })

  it('adds the HNT valued in DC to the DC when the price is present', () => {
    const result = dcWithHnt({
      ...loaded,
      myDc: BigInt(5),
      myHnt: BigInt(100),
      hntAsDc: new BN(700000000),
    })
    expect(result.loadingMyDcWithHnt).toBe(false)
    expect(result.myDcWithHnt?.toString()).toBe('12')
  })

  it('counts DC only when the wallet holds no HNT and the price is missing', () => {
    const result = dcWithHnt({
      ...loaded,
      myDc: BigInt(5),
      myHnt: BigInt(0),
      hntAsDc: undefined,
    })
    expect(result.loadingMyDcWithHnt).toBe(false)
    expect(result.myDcWithHnt?.toString()).toBe('5')
  })

  it('is loading while a balance loads', () => {
    const result = dcWithHnt({
      loadingMyDc: true,
      loadingMyHnt: false,
      myDc: undefined,
      myHnt: BigInt(0),
      hntAsDc: new BN(0),
    })
    expect(result.loadingMyDcWithHnt).toBe(true)
    expect(result.myDcWithHnt).toBeUndefined()
  })
})

describe('waitingOnHntPrice', () => {
  // The wallet holds HNT and the HNT price is missing
  const noPrice = (myDc: bigint) =>
    dcWithHnt({ ...loaded, myDc, myHnt: BigInt(100), hntAsDc: undefined })

  it('does not wait when DC alone covers the cost', () => {
    const { loadingMyDcWithHnt } = noPrice(BigInt(10))
    expect(
      waitingOnHntPrice({
        loadingMyDcWithHnt,
        myDc: new BN(10),
        requiredDc: new BN(10),
      }),
    ).toBe(false)
  })

  it('waits when DC alone falls short', () => {
    const { loadingMyDcWithHnt } = noPrice(BigInt(5))
    expect(
      waitingOnHntPrice({
        loadingMyDcWithHnt,
        myDc: new BN(5),
        requiredDc: new BN(10),
      }),
    ).toBe(true)
  })
})
