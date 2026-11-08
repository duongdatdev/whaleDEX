import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testnetPackageIds } from '@mysten/deepbook-v3';
import { bcs } from '@mysten/sui/bcs';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import {
  buildRegisterBalanceManagerTransaction,
  buildCreateBalanceManagerTransaction,
  extractCreatedBalanceManagerId,
  findOwnedBalanceManagers,
  verifyBalanceManager,
  verifyBalanceManagerCapability,
} from './balance-manager';

const owner = `0x${'1'.repeat(64)}`;
const otherOwner = `0x${'2'.repeat(64)}`;
const managerId = `0x${'3'.repeat(64)}`;
const capabilityId = `0x${'4'.repeat(64)}`;
const packageOriginalId = `0x${'5'.repeat(64)}`;
const managerType = `${packageOriginalId}::balance_manager::BalanceManager`;

function fixture() {
  const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://example.com' });
  vi.spyOn(client.ledgerService, 'getServiceInfo').mockReturnValue(
    Promise.resolve({ response: { chain: 'testnet' } }) as never,
  );
  vi.spyOn(client.movePackageService, 'getPackage').mockReturnValue(
    Promise.resolve({
      response: {
        package: {
          storageId: testnetPackageIds.DEEPBOOK_PACKAGE_ID,
          originalId: packageOriginalId,
        },
      },
    }) as never,
  );
  return client;
}

function managerObject(type = managerType) {
  return {
    object: {
      objectId: managerId,
      type,
      owner: { $kind: 'Shared', Shared: { initialSharedVersion: '1' } },
    },
  };
}

function simulatedAddress(address: string) {
  return {
    $kind: 'Transaction',
    Transaction: {},
    commandResults: [{ returnValues: [{ bcs: bcs.Address.serialize(address).toBytes() }] }],
  };
}

describe('DeepBook BalanceManager safeguards', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('builds a Testnet create-and-share transaction for the wallet to sign', async () => {
    const client = fixture();
    const transaction = await buildCreateBalanceManagerTransaction(client, owner);
    const data = transaction.getData();
    const serialized = JSON.stringify(data);

    expect(data.sender).toBe(owner);
    expect(serialized).toContain(`"package":"${testnetPackageIds.DEEPBOOK_PACKAGE_ID}"`);
    expect(serialized).toContain('"function":"new"');
    expect(serialized).toContain('"function":"public_share_object"');
  });

  it('extracts only a newly created BalanceManager from wallet execution effects', async () => {
    const client = fixture();
    await expect(
      extractCreatedBalanceManagerId(client, {
        Transaction: {
          effects: {
            changedObjects: [
              { idOperation: 'Created', objectId: capabilityId },
              { idOperation: 'Created', objectId: managerId },
            ],
          },
          objectTypes: {
            [capabilityId]: `${packageOriginalId}::balance_manager::TradeCap`,
            [managerId]: managerType,
          },
        },
      }),
    ).resolves.toBe(managerId);
    await expect(extractCreatedBalanceManagerId(client, {})).rejects.toThrow(
      'Không tìm thấy BalanceManager mới trong kết quả giao dịch ví.',
    );
  });

  it('builds registry registration only after verifying manager ownership', async () => {
    const client = fixture();
    vi.spyOn(client.core, 'getObject').mockResolvedValue(managerObject() as never);
    vi.spyOn(client.core, 'simulateTransaction').mockResolvedValue(
      simulatedAddress(owner) as never,
    );

    const transaction = await buildRegisterBalanceManagerTransaction(client, owner, managerId);
    const data = transaction.getData();
    const serialized = JSON.stringify(data);

    expect(data.sender).toBe(owner);
    expect(serialized).toContain('"function":"register_balance_manager"');
    expect(serialized).toContain(testnetPackageIds.REGISTRY_ID);

    const otherOwnerClient = fixture();
    vi.spyOn(otherOwnerClient.core, 'getObject').mockResolvedValue(managerObject() as never);
    vi.spyOn(otherOwnerClient.core, 'simulateTransaction').mockResolvedValue(
      simulatedAddress(otherOwner) as never,
    );
    await expect(
      buildRegisterBalanceManagerTransaction(otherOwnerClient, owner, managerId),
    ).rejects.toThrow('BalanceManager không thuộc ví hiện tại.');
  });

  it('discovers registry managers only after matching the deployed package and Move owner', async () => {
    const client = fixture();
    vi.spyOn(client.core, 'getObject').mockResolvedValue(managerObject() as never);
    vi.spyOn(client.core, 'simulateTransaction')
      .mockResolvedValueOnce({
        $kind: 'Transaction',
        Transaction: {},
        commandResults: [
          { returnValues: [{ bcs: bcs.vector(bcs.Address).serialize([managerId]).toBytes() }] },
        ],
      } as never)
      .mockResolvedValueOnce(simulatedAddress(owner) as never);

    await expect(findOwnedBalanceManagers(client, owner)).resolves.toEqual([
      { id: managerId, owner, network: 'testnet', packageOriginalId },
    ]);
  });

  it('rejects a manager owned by another wallet even if its object type is valid', async () => {
    const client = fixture();
    vi.spyOn(client.core, 'getObject').mockResolvedValue(managerObject() as never);
    vi.spyOn(client.core, 'simulateTransaction').mockResolvedValue(
      simulatedAddress(otherOwner) as never,
    );

    await expect(verifyBalanceManager(client, owner, managerId)).rejects.toThrow(
      'BalanceManager không thuộc ví hiện tại.',
    );
  });

  it('rejects a manager from another package or an unshared object', async () => {
    const wrongTypeClient = fixture();
    vi.spyOn(wrongTypeClient.core, 'getObject').mockResolvedValue(
      managerObject(`0x${'6'.repeat(64)}::balance_manager::BalanceManager`) as never,
    );
    await expect(verifyBalanceManager(wrongTypeClient, owner, managerId)).rejects.toThrow(
      'Đối tượng không phải BalanceManager của DeepBook Testnet.',
    );

    const ownedManagerClient = fixture();
    vi.spyOn(ownedManagerClient.core, 'getObject').mockResolvedValue({
      object: {
        objectId: managerId,
        type: managerType,
        owner: { $kind: 'AddressOwner', AddressOwner: owner },
      },
    } as never);
    await expect(verifyBalanceManager(ownedManagerClient, owner, managerId)).rejects.toThrow(
      'BalanceManager chưa được chia sẻ trên Sui Testnet.',
    );
  });

  it('rejects mainnet and a Testnet package storage id outside the SDK allowlist', async () => {
    const mainnet = new SuiGrpcClient({ network: 'mainnet', baseUrl: 'https://example.com' });
    await expect(buildCreateBalanceManagerTransaction(mainnet, owner)).rejects.toThrow(
      'Chỉ hỗ trợ Sui Testnet.',
    );

    const client = fixture();
    vi.spyOn(client.movePackageService, 'getPackage').mockReturnValue(
      Promise.resolve({
        response: {
          package: {
            storageId: `0x${'7'.repeat(64)}`,
            originalId: packageOriginalId,
          },
        },
      }) as never,
    );
    await expect(buildCreateBalanceManagerTransaction(client, owner)).rejects.toThrow(
      'DeepBook package không khớp deployment Sui Testnet trong SDK.',
    );
  });

  it('accepts only a capability owned by the wallet and bound to its manager', async () => {
    const client = fixture();
    const capBcs = bcs
      .struct('TradeCap', { id: bcs.Address, balance_manager_id: bcs.Address })
      .serialize({ id: capabilityId, balance_manager_id: managerId })
      .toBytes();
    vi.spyOn(client.core, 'getObject').mockImplementation(async ({ objectId }) => {
      if (objectId === managerId) return managerObject() as never;
      return {
        object: {
          objectId: capabilityId,
          type: `${packageOriginalId}::balance_manager::TradeCap`,
          owner: { $kind: 'AddressOwner', AddressOwner: owner },
          content: capBcs,
        },
      } as never;
    });
    vi.spyOn(client.core, 'simulateTransaction').mockResolvedValue(
      simulatedAddress(owner) as never,
    );

    await expect(
      verifyBalanceManagerCapability(client, owner, managerId, capabilityId, 'trade'),
    ).resolves.toEqual({ id: capabilityId, managerId, owner, kind: 'trade' });
  });

  it('rejects a valid capability object linked to a different BalanceManager', async () => {
    const client = fixture();
    const capBcs = bcs
      .struct('TradeCap', { id: bcs.Address, balance_manager_id: bcs.Address })
      .serialize({ id: capabilityId, balance_manager_id: otherOwner })
      .toBytes();
    vi.spyOn(client.core, 'getObject').mockImplementation(async ({ objectId }) => {
      if (objectId === managerId) return managerObject() as never;
      return {
        object: {
          objectId: capabilityId,
          type: `${packageOriginalId}::balance_manager::TradeCap`,
          owner: { $kind: 'AddressOwner', AddressOwner: owner },
          content: capBcs,
        },
      } as never;
    });
    vi.spyOn(client.core, 'simulateTransaction').mockResolvedValue(
      simulatedAddress(owner) as never,
    );

    await expect(
      verifyBalanceManagerCapability(client, owner, managerId, capabilityId, 'trade'),
    ).rejects.toThrow('Capability không thuộc BalanceManager đã chọn.');
  });
});
