import { jazzicon } from '../jazzicon'

// Expected values come from react-native-jazzicon 0.1.2, the library this
// port replaces, so existing account icons keep their look.
describe('jazzicon', () => {
  it('matches react-native-jazzicon for a large seed', () => {
    expect(jazzicon(3735928559, 56)).toEqual({
      background: '#15B7F2',
      shapes: [
        {
          fill: '#F71D01',
          transform:
            'translate(-10.610605069608278 5.062335527122019) rotate(179.5 28 28)',
        },
        {
          fill: '#FC5200',
          transform:
            'translate(0.003505520465975199 -26.57246833454751) rotate(370.7 28 28)',
        },
        {
          fill: '#F39F00',
          transform:
            'translate(-33.83710695331863 35.93511254545834) rotate(298.9 28 28)',
        },
      ],
    })
  })

  it('matches react-native-jazzicon for a small seed and odd size', () => {
    expect(jazzicon(1, 41)).toEqual({
      background: '#15A1F2',
      shapes: [
        {
          fill: '#F19402',
          transform:
            'translate(0.001424944738085368 -0.0006427690545946875) rotate(358.8 20.5 20.5)',
        },
        {
          fill: '#FC6B00',
          transform:
            'translate(10.206078128554738 13.46167583767297) rotate(69.5 20.5 20.5)',
        },
        {
          fill: '#246DE1',
          transform:
            'translate(-24.429217810752686 20.755727730946447) rotate(260.2 20.5 20.5)',
        },
      ],
    })
  })

  it('matches react-native-jazzicon for a seed with the top bit set', () => {
    expect(jazzicon(2147483648, 32)).toEqual({
      background: '#2486E1',
      shapes: [
        {
          fill: '#F71401',
          transform:
            'translate(-5.298625192067957 6.352184883316837) rotate(159.0 16 16)',
        },
        {
          fill: '#FC1987',
          transform:
            'translate(-8.32576077755873 12.734334006780125) rotate(175.7 16 16)',
        },
        {
          fill: '#15BEF2',
          transform:
            'translate(25.437081309000767 6.925968984505053) rotate(168.2 16 16)',
        },
      ],
    })
  })

  it('gives the same icon on every call for one seed', () => {
    expect(jazzicon(42, 56)).toEqual(jazzicon(42, 56))
  })
})
