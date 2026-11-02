import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import DeviceShow from '../DeviceShow'

type MockItem = { address: string }
type MockSection = { index: number; data: MockItem[] }
const mockRenderItems: unknown[] = []
const mockUpsertAccounts = jest.fn((_accounts: unknown) => Promise.resolve())

// SectionList renders every section header and item, so the test can reach
// the Select All control and each account row.
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  const SectionList = ({
    sections,
    renderItem,
    renderSectionHeader,
  }: {
    sections: MockSection[]
    renderItem: (info: {
      item: MockItem
      index: number
      section: MockSection
    }) => React.ReactNode
    renderSectionHeader: (info: { section: MockSection }) => React.ReactNode
  }) => {
    mockRenderItems.push(renderItem)
    return ReactActual.createElement(
      'SectionList',
      null,
      sections.map((section) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: section.index },
          renderSectionHeader({ section }),
          section.data.map((item, index) =>
            ReactActual.createElement(
              ReactActual.Fragment,
              { key: item.address },
              renderItem({ item, index, section }),
            ),
          ),
        ),
      ),
    )
  }
  return { View: 'View', SectionList }
})
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {}, goBack: () => {} }
  const route = {
    params: { ledgerDevice: { id: 'device-id', name: 'Nano X', type: 'usb' } },
  }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('lucide-react-native', () => ({ ChevronRight: 'ChevronRight' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@assets/images/ledger.svg', () => 'Ledger', { virtual: true })
jest.mock('@assets/images/fingerprintGreen.png', () => 1, { virtual: true })
jest.mock('react-native-gesture-handler', () => ({
  TouchableOpacity: 'TouchableOpacity',
}))
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/BackButton', () => ({ BackButton: 'BackButton' }), {
  virtual: true,
})
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock('../LedgerAccountListItem', () => ({
  __esModule: true,
  default: 'LedgerAccountListItem',
  Section: { NEW_ACCOUNT: 0, ALREADY_LINKED: 1 },
}))

// Each test sets the stored accounts and the accounts the Ledger shows.
let mockAccounts: Record<string, object> = {}
let mockLedgerAccounts: { address: string }[] = []
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    get accounts() {
      return mockAccounts
    },
    upsertAccounts: (accs: unknown) => mockUpsertAccounts(accs),
  }
  return { useAccountStorage: () => accountStorage, MAX_ACCOUNTS: 50 }
})
jest.mock(
  '@hooks/useLedger',
  () => {
    const ledger = {
      updateLedgerAccounts: () => Promise.resolve(),
      get ledgerAccounts() {
        return mockLedgerAccounts
      },
      ledgerAccountsLoading: false,
    }
    return { __esModule: true, default: () => ledger }
  },
  { virtual: true },
)

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const ledgerAccount = (address: string, accountIndex: number) => ({
  address,
  alias: address,
  accountIndex,
  solanaAddress: address,
  derivationPath: '',
  balance: 0,
})

const storeAccounts = (addresses: string[]) => {
  mockAccounts = {}
  addresses.forEach((address) => {
    mockAccounts[address] = {}
  })
}

const renderDeviceShow = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<DeviceShow />)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

const pressSelectAll = async (renderer: TestRenderer.ReactTestRenderer) => {
  const selectAll = renderer.root.findByType('TouchableOpacity' as never)
  await act(async () => {
    selectAll.props.onPress()
  })
}

const buttonLabel = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Button' as never).props.children

const showsAccountLimit = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType('Text' as never)
    .some((n) => n.props.children === 'accountImport.accountLimitLedger')

const others = (count: number) =>
  Array.from({ length: count }, (_, i) => `other${i}`)

describe('DeviceShow', () => {
  it('does not count already-linked accounts against the limit on Select All', async () => {
    // 47 stored accounts, 3 of them linked from this Ledger
    storeAccounts([...others(44), 'L0', 'L1', 'L2'])
    mockLedgerAccounts = ['L0', 'L1', 'L2', 'N0', 'N1'].map(ledgerAccount)
    const renderer = await renderDeviceShow()

    await pressSelectAll(renderer)

    expect(buttonLabel(renderer)).toBe('ledger.show.next')
    expect(showsAccountLimit(renderer)).toBe(false)
  })

  it('shows the account limit when the new accounts go over it', async () => {
    storeAccounts(others(49))
    mockLedgerAccounts = ['N0', 'N1'].map(ledgerAccount)
    const renderer = await renderDeviceShow()

    await pressSelectAll(renderer)

    expect(buttonLabel(renderer)).toBe('ledger.show.close')
    expect(showsAccountLimit(renderer)).toBe(true)
  })

  it('keeps the row renderer when the screen re-renders', async () => {
    storeAccounts([])
    mockLedgerAccounts = ['N0', 'N1'].map(ledgerAccount)
    const renderer = await renderDeviceShow()
    const before = mockRenderItems[mockRenderItems.length - 1]

    await act(async () => {
      renderer.update(<DeviceShow />)
    })

    expect(mockRenderItems[mockRenderItems.length - 1]).toBe(before)
  })

  it('adds the account that was checked', async () => {
    storeAccounts([])
    mockLedgerAccounts = ['N0', 'N1'].map(ledgerAccount)
    const renderer = await renderDeviceShow()
    const rows = renderer.root.findAllByType('LedgerAccountListItem' as never)
    expect(rows[0].props.onCheckboxToggled).toBe(
      rows[1].props.onCheckboxToggled,
    )

    await act(async () => {
      rows[1].props.onCheckboxToggled(rows[1].props.item, true)
    })
    await act(async () => {
      renderer.root.findByType('Button' as never).props.onPress()
    })

    expect(mockUpsertAccounts).toHaveBeenCalledTimes(1)
    expect(mockUpsertAccounts).toHaveBeenCalledWith([
      expect.objectContaining({ address: 'N1', ledgerIndex: 1 }),
    ])
  })
})
