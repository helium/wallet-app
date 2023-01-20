import { registerWallet } from './register';
import { HeliumWallet } from './wallet';
import type { Helium } from './window';

export function initialize(helium: Helium): void {
    registerWallet(new HeliumWallet(helium));
}
