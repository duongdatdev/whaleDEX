import { deepbook, testnetPackageIds } from '@mysten/deepbook-v3';
import { bcs } from '@mysten/sui/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
import type { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { isValidSuiAddress, normalizeSuiAddress, normalizeStructTag } from '@mysten/sui/utils';
import { assertTestnet } from './deepbook';

const MANAGER_KEY = 'WHALEDEX_ACCOUNT';

const capabilityTypes = {
  trade: {
    typeName: 'TradeCap',
    bcs: bcs.struct('TradeCap', { id: bcs.Address, balance_manager_id: bcs.Address }),
  },
  deposit: {
    typeName: 'DepositCap',
    bcs: bcs.struct('DepositCap', { id: bcs.Address, balance_manager_id: bcs.Address }),
  },
  withdraw: {
    typeName: 'WithdrawCap',
    bcs: bcs.struct('WithdrawCap', { id: bcs.Address, balance_manager_id: bcs.Address }),
  },
} as const;

export type BalanceManagerCapability = keyof typeof capabilityTypes;
export type VerifiedBalanceManager = {
  id: string;
  owner: string;
  network: 'testnet';
  packageOriginalId: string;
};
export type VerifiedManagerCapability = {
  id: string;
  managerId: string;
  owner: string;
  kind: BalanceManagerCapability;
};

type BalanceManagerExecutionResult = {
  Transaction?: {
    effects?: {
      changedObjects?: Array<{ idOperation?: string; objectId?: string }>;
    };
    objectTypes?: Record<string, string>;
  };
};

function normalizeOwner(owner: string) {
  if (!isValidSuiAddress(owner)) throw new Error('Địa chỉ ví Sui không hợp lệ.');
  return normalizeSuiAddress(owner);
}

function addressOwner(owner: SuiClientTypes.ObjectOwner) {
  if (owner.$kind === 'AddressOwner') return owner.AddressOwner;
  if (owner.$kind === 'ConsensusAddressOwner') return owner.ConsensusAddressOwner.owner;
  return undefined;
}

async function verifyTestnetPackage(client: SuiGrpcClient) {
  assertTestnet(client);
  const [{ response: service }, { response }] = await Promise.all([
    client.ledgerService.getServiceInfo({}),
    client.movePackageService.getPackage({ packageId: testnetPackageIds.DEEPBOOK_PACKAGE_ID }),
  ]);
  const deployed = response.package;
  if (
    service.chain !== 'testnet' ||
    !deployed?.storageId ||
    !deployed.originalId ||
    normalizeSuiAddress(deployed.storageId) !==
      normalizeSuiAddress(testnetPackageIds.DEEPBOOK_PACKAGE_ID)
  ) {
    throw new Error('DeepBook package không khớp deployment Sui Testnet trong SDK.');
  }
  return normalizeSuiAddress(deployed.originalId);
}

function firstReturnValue(
  result: SuiClientTypes.SimulateTransactionResult<{ commandResults: true }>,
) {
  if (result.$kind === 'FailedTransaction') {
    throw new Error('Không thể xác minh BalanceManager trên Testnet.');
  }
  const value = result.commandResults?.[0]?.returnValues?.[0]?.bcs;
  if (!value) throw new Error('DeepBook không trả dữ liệu BalanceManager hợp lệ.');
  return value;
}

async function verifyBalanceManagerWithPackage(
  client: SuiGrpcClient,
  owner: string,
  managerId: string,
  packageOriginalId: string,
): Promise<VerifiedBalanceManager> {
  const id = normalizeSuiAddress(managerId);
  const { object } = await client.core.getObject({ objectId: id });
  const expectedType = `${packageOriginalId}::balance_manager::BalanceManager`;
  if (!object.type || normalizeStructTag(object.type) !== normalizeStructTag(expectedType)) {
    throw new Error('Đối tượng không phải BalanceManager của DeepBook Testnet.');
  }
  if (object.owner.$kind !== 'Shared') {
    throw new Error('BalanceManager chưa được chia sẻ trên Sui Testnet.');
  }

  const clientWithDeepBook = client.$extend(
    deepbook({ address: owner, balanceManagers: { [MANAGER_KEY]: { address: id } } }),
  );
  const transaction = new Transaction();
  transaction.setSender(owner);
  clientWithDeepBook.deepbook.balanceManager.owner(MANAGER_KEY)(transaction);
  const result = await client.core.simulateTransaction({
    transaction,
    include: { commandResults: true },
  });
  const actualOwner = normalizeSuiAddress(bcs.Address.parse(firstReturnValue(result)));
  if (actualOwner !== owner) throw new Error('BalanceManager không thuộc ví hiện tại.');

  return { id, owner, network: 'testnet', packageOriginalId };
}

/** Build a create-and-share transaction for the connected wallet to sign. Never signs here. */
export async function buildCreateBalanceManagerTransaction(client: SuiGrpcClient, owner: string) {
  const sender = normalizeOwner(owner);
  await verifyTestnetPackage(client);
  const deepBookClient = client.$extend(deepbook({ address: sender }));
  const transaction = new Transaction();
  transaction.setSender(sender);
  deepBookClient.deepbook.balanceManager.createAndShareBalanceManager()(transaction);
  return transaction;
}

/** Read the newly shared manager ID from the wallet's successful execution result. */
export async function extractCreatedBalanceManagerId(
  client: SuiGrpcClient,
  result: BalanceManagerExecutionResult,
) {
  const packageOriginalId = await verifyTestnetPackage(client);
  const expectedType = normalizeStructTag(
    `${normalizeSuiAddress(packageOriginalId)}::balance_manager::BalanceManager`,
  );
  const createdManager = result.Transaction?.effects?.changedObjects?.find((changedObject) => {
    if (changedObject.idOperation !== 'Created' || !changedObject.objectId) return false;
    const objectType = result.Transaction?.objectTypes?.[changedObject.objectId];
    return Boolean(objectType && normalizeStructTag(objectType) === expectedType);
  });
  if (!createdManager?.objectId) {
    throw new Error('Không tìm thấy BalanceManager mới trong kết quả giao dịch ví.');
  }
  return normalizeSuiAddress(createdManager.objectId);
}

/** Build a wallet-signed registry registration after verifying the shared manager belongs to it. */
export async function buildRegisterBalanceManagerTransaction(
  client: SuiGrpcClient,
  owner: string,
  managerId: string,
) {
  const account = normalizeOwner(owner);
  const manager = await verifyBalanceManager(client, account, managerId);
  const deepBookClient = client.$extend(
    deepbook({
      address: account,
      balanceManagers: { [MANAGER_KEY]: { address: manager.id } },
    }),
  );
  const transaction = new Transaction();
  transaction.setSender(account);
  deepBookClient.deepbook.balanceManager.registerBalanceManager(MANAGER_KEY)(transaction);
  return transaction;
}

/** Find registry-listed managers, then verify their package, shared state, and Move owner. */
export async function findOwnedBalanceManagers(
  client: SuiGrpcClient,
  owner: string,
): Promise<VerifiedBalanceManager[]> {
  const account = normalizeOwner(owner);
  const packageOriginalId = await verifyTestnetPackage(client);
  const deepBookClient = client.$extend(deepbook({ address: account }));
  const ids = await deepBookClient.deepbook.getBalanceManagerIds(account);
  return Promise.all(
    [...new Set(ids.map((id) => normalizeSuiAddress(id)))].map((managerId) =>
      verifyBalanceManagerWithPackage(client, account, managerId, packageOriginalId),
    ),
  );
}

/** Reject managers owned by another account and return verified Testnet metadata. */
export async function verifyBalanceManager(
  client: SuiGrpcClient,
  owner: string,
  managerId: string,
) {
  const account = normalizeOwner(owner);
  const packageOriginalId = await verifyTestnetPackage(client);
  return verifyBalanceManagerWithPackage(client, account, managerId, packageOriginalId);
}

/** Verify that an owned capability has the expected DeepBook type and targets this manager. */
export async function verifyBalanceManagerCapability(
  client: SuiGrpcClient,
  owner: string,
  managerId: string,
  capabilityId: string,
  kind: BalanceManagerCapability,
): Promise<VerifiedManagerCapability> {
  const account = normalizeOwner(owner);
  const manager = await verifyBalanceManager(client, account, managerId);
  const id = normalizeSuiAddress(capabilityId);
  const { object } = await client.core.getObject({
    objectId: id,
    include: { content: true },
  });
  const capabilityType = capabilityTypes[kind];
  const expectedType = `${manager.packageOriginalId}::balance_manager::${capabilityType.typeName}`;
  if (!object.type || normalizeStructTag(object.type) !== normalizeStructTag(expectedType)) {
    throw new Error('Capability không đúng loại DeepBook.');
  }
  const actualOwner = addressOwner(object.owner);
  if (!actualOwner || normalizeSuiAddress(actualOwner) !== account) {
    throw new Error('Capability không thuộc ví hiện tại.');
  }
  if (!object.content) throw new Error('Không thể đọc nội dung capability trên Testnet.');
  const capability = capabilityType.bcs.parse(object.content);
  if (normalizeSuiAddress(capability.balance_manager_id) !== manager.id) {
    throw new Error('Capability không thuộc BalanceManager đã chọn.');
  }
  return { id, managerId: manager.id, owner: account, kind };
}
