/**
 * This is a port of the anchor command `anchor idl convert` to TypeScript.
 */
import { Idl } from '@coral-xyz/anchor'
import {
  IdlAccount,
  IdlConst,
  IdlDefinedFields,
  IdlEnumVariant,
  IdlErrorCode,
  IdlEvent,
  IdlField,
  IdlInstruction,
  IdlInstructionAccountItem,
  IdlInstructionAccounts,
  IdlMetadata,
  IdlType,
  IdlTypeDef,
  IdlTypeDefined,
} from '@coral-xyz/anchor/dist/cjs/idl'
import { sha256 } from '@noble/hashes/sha256'

// Legacy types based on the Rust structs
// Should be included in next minor release of anchor
export interface LegacyIdl {
  version: string
  name: string
  docs?: string[]
  constants: LegacyIdlConst[]
  instructions: LegacyIdlInstruction[]
  accounts: LegacyIdlTypeDefinition[]
  types: LegacyIdlTypeDefinition[]
  events?: LegacyIdlEvent[]
  errors?: LegacyIdlErrorCode[]
  metadata?: any
}

interface LegacyIdlConst {
  name: string
  type: LegacyIdlType
  value: string
}

interface LegacyIdlInstruction {
  name: string
  docs?: string[]
  accounts: LegacyIdlAccountItem[]
  args: LegacyIdlField[]
  returns?: LegacyIdlType
}

interface LegacyIdlTypeDefinition {
  name: string
  docs?: string[]
  type: LegacyIdlTypeDefinitionTy
}

type LegacyIdlTypeDefinitionTy =
  | { kind: 'struct'; fields: LegacyIdlField[] }
  | { kind: 'enum'; variants: LegacyIdlEnumVariant[] }
  | { kind: 'alias'; value: LegacyIdlType }

interface LegacyIdlField {
  name: string
  docs?: string[]
  type: LegacyIdlType
}

interface LegacyIdlEnumVariant {
  name: string
  fields?: LegacyEnumFields
}

type LegacyEnumFields = LegacyIdlField[] | LegacyIdlType[]

interface LegacyIdlEvent {
  name: string
  fields: LegacyIdlEventField[]
}

interface LegacyIdlEventField {
  name: string
  type: LegacyIdlType
  index: boolean
}

interface LegacyIdlErrorCode {
  code: number
  name: string
  msg?: string
}

type LegacyIdlAccountItem = LegacyIdlAccount | LegacyIdlAccounts

interface LegacyIdlAccount {
  name: string
  isMut: boolean
  isSigner: boolean
  isOptional?: boolean
  docs?: string[]
  pda?: LegacyIdlPda
  relations: string[]
}

interface LegacyIdlAccounts {
  name: string
  accounts: LegacyIdlAccountItem[]
}

interface LegacyIdlPda {
  seeds: LegacyIdlSeed[]
  programId?: LegacyIdlSeed
}

type LegacyIdlSeed =
  | { kind: 'const'; type: LegacyIdlType; value: any }
  | { kind: 'arg'; type: LegacyIdlType; path: string }
  | { kind: 'account'; type: LegacyIdlType; account?: string; path: string }

type LegacyIdlType =
  | 'bool'
  | 'u8'
  | 'i8'
  | 'u16'
  | 'i16'
  | 'u32'
  | 'i32'
  | 'u64'
  | 'i64'
  | 'u128'
  | 'i128'
  | 'f32'
  | 'f64'
  | 'bytes'
  | 'string'
  | 'publicKey'
  | { vec: LegacyIdlType }
  | { option: LegacyIdlType }
  | { defined: string }
  | { array: [LegacyIdlType, number] }
  | { generic: string }
  | { definedWithTypeArgs: { name: string; args: LegacyIdlDefinedTypeArg[] } }

type LegacyIdlDefinedTypeArg =
  | { generic: string }
  | { value: string }
  | { type: LegacyIdlType }

// Remove the dynamic import
function getSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

export function convertLegacyIdl(
  legacyIdl: LegacyIdl,
  programAddress?: string,
): Idl {
  const address: string | undefined =
    programAddress ?? legacyIdl.metadata?.address
  if (!address) {
    throw new Error('Program id missing in `idl.metadata.address` field')
  }
  return {
    accounts: (legacyIdl.accounts || []).map(convertAccount),
    address,
    constants: (legacyIdl.constants || []).map(convertConst),
    errors: legacyIdl.errors?.map(convertErrorCode) || [],
    events: legacyIdl.events?.map(convertEvent) || [],
    instructions: legacyIdl.instructions.map(convertInstruction),
    metadata: {
      name: legacyIdl.name,
      version: legacyIdl.version,
    } as IdlMetadata,
    types: [
      ...(legacyIdl.types || []).map(convertTypeDef),
      ...(legacyIdl.accounts || []).map(convertTypeDef),
      ...(legacyIdl.events || []).map(convertEventToTypeDef),
    ],
  }
}

function getDisc(prefix: string, name: string): number[] {
  const hash = sha256(`${prefix}:${name}`)
  return Array.from(hash.slice(0, 8))
}

function convertInstruction(instruction: LegacyIdlInstruction): IdlInstruction {
  const name = getSnakeCase(instruction.name)
  return {
    accounts: instruction.accounts.map(convertInstructionAccount),
    args: instruction.args.map(convertField),
    discriminator: getDisc('global', name),
    name,
    returns: instruction.returns ? convertType(instruction.returns) : undefined,
  }
}

function convertAccount(account: LegacyIdlTypeDefinition): IdlAccount {
  return {
    discriminator: getDisc('account', account.name),
    name: account.name,
  }
}

function convertTypeDef(typeDef: LegacyIdlTypeDefinition): IdlTypeDef {
  return {
    name: typeDef.name,
    type: convertTypeDefTy(typeDef.type),
  }
}

function convertTypeDefTy(type: LegacyIdlTypeDefinitionTy): IdlTypeDef['type'] {
  switch (type.kind) {
    case 'struct':
      return {
        fields: type.fields.map(convertField),
        kind: 'struct',
      }
    case 'enum':
      return {
        kind: 'enum',
        variants: type.variants.map(convertEnumVariant),
      }
    case 'alias':
      return {
        alias: convertType(type.value),
        kind: 'type',
      }
  }
}

function convertField(field: LegacyIdlField): IdlField {
  return {
    name: getSnakeCase(field.name),
    type: convertType(field.type),
  }
}

function convertEnumVariant(variant: LegacyIdlEnumVariant): IdlEnumVariant {
  return {
    fields: variant.fields ? convertEnumFields(variant.fields) : undefined,
    name: variant.name,
  }
}

function convertEnumFields(fields: LegacyEnumFields): IdlDefinedFields {
  if (
    Array.isArray(fields) &&
    fields.length > 0 &&
    typeof fields[0] === 'object' &&
    'type' in fields[0]
  ) {
    return (fields as LegacyIdlField[]).map(convertField) as IdlField[]
  }
  return (fields as LegacyIdlType[]).map((type) =>
    convertType(type),
  ) as IdlType[]
}

function convertEvent(event: LegacyIdlEvent): IdlEvent {
  return {
    discriminator: getDisc('event', event.name),
    name: event.name,
  }
}

function convertErrorCode(error: LegacyIdlErrorCode): IdlErrorCode {
  return {
    code: error.code,
    msg: error.msg,
    name: error.name,
  }
}

function convertConst(constant: LegacyIdlConst): IdlConst {
  return {
    name: constant.name,
    type: convertType(constant.type),
    value: constant.value,
  }
}

function convertInstructionAccount(
  account: LegacyIdlAccountItem,
): IdlInstructionAccountItem {
  if ('accounts' in account) {
    return convertInstructionAccounts(account)
  }
  return {
    docs: account.docs || [],
    name: getSnakeCase(account.name),
    optional: account.isOptional || false,
    pda: account.pda ? convertPda(account.pda) : undefined,
    relations: account.relations || [],
    signer: account.isSigner || false,
    writable: account.isMut || false,
  }
}

function convertInstructionAccounts(
  accounts: LegacyIdlAccounts,
): IdlInstructionAccounts {
  return {
    accounts: accounts.accounts.map(convertInstructionAccount),
    name: getSnakeCase(accounts.name),
  }
}

function convertPda(pda: LegacyIdlPda): { seeds: any[]; programId?: any } {
  return {
    ...(pda.programId ? { programId: convertSeed(pda.programId) } : {}),
    seeds: pda.seeds.map(convertSeed),
  }
}

function convertSeed(seed: LegacyIdlSeed): any {
  switch (seed.kind) {
    case 'const':
      return { kind: 'const', type: convertType(seed.type), value: seed.value }
    case 'arg':
      return { kind: 'arg', path: seed.path, type: convertType(seed.type) }
    case 'account':
      return {
        ...(seed.account ? { account: seed.account } : {}),
        kind: 'account',
        path: seed.path,
        type: convertType(seed.type),
      }
  }
}

function convertEventToTypeDef(event: LegacyIdlEvent): IdlTypeDef {
  return {
    name: event.name,
    type: {
      fields: event.fields.map((field) => ({
        name: getSnakeCase(field.name),
        type: convertType(field.type),
      })),
      kind: 'struct',
    },
  }
}

function convertType(type: LegacyIdlType): IdlType {
  if (typeof type === 'string') {
    return type === 'publicKey' ? 'pubkey' : type
  }
  if ('vec' in type) {
    return { vec: convertType(type.vec) }
  }
  if ('option' in type) {
    return { option: convertType(type.option) }
  }
  if ('defined' in type) {
    return { defined: { generics: [], name: type.defined } } as IdlTypeDefined
  }
  if ('array' in type) {
    return { array: [convertType(type.array[0]), type.array[1]] }
  }
  if ('generic' in type) {
    return type
  }
  if ('definedWithTypeArgs' in type) {
    return {
      defined: {
        generics: type.definedWithTypeArgs.args.map(convertDefinedTypeArg),
        name: type.definedWithTypeArgs.name,
      },
    } as IdlTypeDefined
  }
  throw new Error(`Unsupported type: ${JSON.stringify(type)}`)
}

function convertDefinedTypeArg(arg: LegacyIdlDefinedTypeArg): any {
  if ('generic' in arg) {
    return { generic: arg.generic }
  }
  if ('value' in arg) {
    return { value: arg.value }
  }
  if ('type' in arg) {
    return { type: convertType(arg.type) }
  }
  throw new Error(`Unsupported defined type arg: ${JSON.stringify(arg)}`)
}

export function getIdlSpecType(idl: any): IdlSpec {
  return idl.metadata?.spec ?? 'legacy'
}

export type IdlSpec = '0.1.0' | 'legacy'

export function formatIdl(idl: any, programAddress?: string): Idl {
  const spec = getIdlSpecType(idl)

  switch (spec) {
    case '0.1.0':
      return idl as Idl
    case 'legacy':
      if (!programAddress) {
        throw new Error('Program address is required for legacy IDL')
      }
      return convertLegacyIdl(idl as LegacyIdl, programAddress)
    default:
      throw new Error(`IDL spec not supported: ${spec}`)
  }
}
