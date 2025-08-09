import { graphqlRequest, gql } from './graphql';
import type { GqlVault, GqlStrategy, GqlOutput, GqlTvl, GqlPrice } from './kongTypes';

export type KongClientOptions = {
  url?: string;
  headers?: Record<string, string>;
};

export class KongClient {
  private url: string;
  private headers?: Record<string, string>;

  constructor(opts?: KongClientOptions) {
    this.url = opts?.url ?? 'https://kong.yearn.farm/api/gql';
    this.headers = opts?.headers;
  }

  /**
   * Fetch a vault by chainId and address.
   */
  async getVault(chainId: number, address: `0x${string}`): Promise<GqlVault | null> {
    const query = gql`
      query Vaults($addresses: [String], $chainId: Int) {
        vaults(addresses: $addresses, chainId: $chainId) {
          accountant
          activation
          address
          apiVersion
          asset {
            address
            chainId
            decimals
            name
            symbol
          }
          creditAvailable
          debtOutstanding
          debtRatio
          decimals
          depositLimit
          guardian
          management
          managementFee
          maxAvailableShares
          name
          performanceFee
          pricePerShare
          rewards
          symbol
          token
          totalAssets
          totalDebt
          totalIdle
          totalSupply
          strategies
          yearn
        }
      }
    `;
    const res = await graphqlRequest<{ vault: GqlVault | null }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: { chainId, addresses: [address] },
      throwOnError: false,
    });
    if ('errors' in res) return null;
    return res.data.vault;
  }

  /**
   * Fetch a strategy by chainId and address.
   */
  async getStrategy(chainId: number, address: `0x${string}`): Promise<GqlStrategy | null> {
    const query = gql`
      query Strategy($chainId: Int, $address: String) {
        strategy(chainId: $chainId, address: $address) {
          MAX_FEE
          MIN_FEE
          baseFeeOracle
          curveVoter
          crv
          decimals
          gauge
          inceptBlock
          inceptTime
          keeper
          localKeepCRV
          name
          performanceFee
          rewards
          stakedBalance
          symbol
          totalAssets
          totalDebt
          totalSupply
          address
          chainId
        }
      }
    `;
    const res = await graphqlRequest<{ strategy: GqlStrategy | null }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: { chainId, address },
      throwOnError: false,
    });
    if ('errors' in res) return null;
    return res.data.strategy;
  }

  /**
   * Fetch all strategies for a given vault.
   */
  async getVaultStrategies(chainId: number, vault: `0x${string}`): Promise<GqlStrategy[]> {
    const query = gql`
      query VaultStrategies($chainId: Int, $vault: String) {
        vaultStrategies(chainId: $chainId, vault: $vault) {
          chainId
          address
          apiVersion
          balanceOfWant
          baseFeeOracle
          creditThreshold
          crv
          curveVoter
          delegatedAssets
          doHealthCheck
          emergencyExit
          erc4626
          estimatedTotalAssets
          forceHarvestTriggerOnce
          gauge
          healthCheck
          inceptTime
          inceptBlock
          isActive
          isBaseFeeAcceptable
          isOriginal
          keeper
          localKeepCRV
          maxReportDelay
          metadataURI
          minReportDelay
          name
          proxy
          rewards
          stakedBalance
          strategist
          tradeFactory
          vault
          want
          DOMAIN_SEPARATOR
          FACTORY
          MAX_FEE
          MIN_FEE
          decimals
          fullProfitUnlockDate
          isShutdown
          lastReport
          management
          pendingManagement
          performanceFee
          performanceFeeRecipient
          pricePerShare
          profitMaxUnlockTime
          profitUnlockingRate
          symbol
          totalAssets
          totalDebt
          totalIdle
          totalSupply
          totalDebtUsd
          meta {
            displayName
          }
          v3
          yearn
        }
      }
    `;
    const res = await graphqlRequest<{ vaultStrategies: GqlStrategy[] }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: { chainId, vault },
      throwOnError: false,
    });
    if ('errors' in res) return [];
    return res.data.vaultStrategies;
  }

  /**
   * Fetch prices for a given set of parameters.
   */
  async getPrices(params: {
    chainId?: number;
    address?: `0x${string}`;
    timestamp?: string | number;
  }): Promise<GqlPrice[]> {
    const query = gql`
      query Prices($chainId: Int, $address: String, $timestamp: BigInt) {
        prices(chainId: $chainId, address: $address, timestamp: $timestamp) {
          chainId
          address
          priceUsd
          priceSource
          blockNumber
          blockTime
        }
      }
    `;
    const res = await graphqlRequest<{ prices: GqlPrice[] }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: params,
      throwOnError: false,
    });
    if ('errors' in res) return [];
    return res.data.prices;
  }

  /**
   * Fetch timeseries data for a given set of parameters.
   */
  async getTimeseries(params: {
    chainId?: number;
    address?: `0x${string}`;
    label: string;
    component?: string;
    period?: string;
    limit?: number;
    timestamp?: string | number;
    yearn?: boolean;
  }): Promise<GqlOutput[]> {
    const query = gql`
      query Timeseries(
        $chainId: Int
        $address: String
        $label: String!
        $component: String
        $period: String
        $limit: Int
        $timestamp: BigInt
        $yearn: Boolean
      ) {
        timeseries(
          chainId: $chainId
          address: $address
          label: $label
          component: $component
          period: $period
          limit: $limit
          timestamp: $timestamp
          yearn: $yearn
        ) {
          chainId
          address
          label
          component
          value
          blockNumber
          blockTime
        }
      }
    `;
    const res = await graphqlRequest<{ timeseries: GqlOutput[] }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: params,
      throwOnError: false,
    });
    if ('errors' in res) return [];
    return res.data.timeseries;
  }

  /**
   * Fetch TVL (Total Value Locked) data for a given set of parameters.
   */
  async getTvls(params: {
    chainId: number;
    address?: `0x${string}`;
    period?: string;
    limit?: number;
    timestamp?: string | number;
  }): Promise<GqlTvl[]> {
    const query = gql`
      query Tvls(
        $chainId: Int!
        $address: String
        $period: String
        $limit: Int
        $timestamp: BigInt
      ) {
        tvls(
          chainId: $chainId
          address: $address
          period: $period
          limit: $limit
          timestamp: $timestamp
        ) {
          chainId
          address
          tvlUsd
          priceUsd
          blockNumber
          blockTime
        }
      }
    `;
    const res = await graphqlRequest<{ tvls: GqlTvl[] }>({
      url: this.url,
      headers: this.headers,
      query,
      variables: params,
      throwOnError: false,
    });
    if ('errors' in res) return [];
    return res.data.tvls;
  }

  /**
   * Fetch outputs for a given chainId, address, and label.
   * This is a convenience wrapper for getTimeseries.
   */
  async getOutputs(chainId: number, address: `0x${string}`, label: string): Promise<GqlOutput[]> {
    return this.getTimeseries({ chainId, address, label });
  }

  /**
   * Fetch a snapshot-like object for an address.
   * Returns either a vault or strategy object, or null if not found.
   */
  async getSnapshot(
    chainId: number,
    address: `0x${string}`,
  ): Promise<{ kind: 'vault' | 'strategy'; data: GqlVault | GqlStrategy } | null> {
    const vault = await this.getVault(chainId, address);
    if (vault) return { kind: 'vault', data: vault };
    const strategy = await this.getStrategy(chainId, address);
    if (strategy) return { kind: 'strategy', data: strategy };
    return null;
  }
}
