import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import {
  BlockHandlerContext,
  LogHandlerContext,
  EvmBatchProcessor,
} from "@subsquid/evm-processor";
import { events, Contract } from "./abi/weth";
import { Weth } from "./model";
import { BigNumber } from "ethers";

const processor = new EvmBatchProcessor()
  .setDataSource({
    // uncomment and set RPC_ENDPOONT to enable contract state queries.
    // Both https and wss endpoints are supported.
    // chain: process.env.RPC_ENDPOINT,

    // Change the Archive endpoints for run the squid
    // against the other  EVM networks:
    // Polygon: https://polygon.archive.subsquid.io
    // Goerli: https://goerli.archive.subsquid.io
    chain: "https://rpc.ankr.com/eth",
    archive: "https://eth.archive.subsquid.io",
  })
  .addLog("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase(), {
    filter: [[events.Deposit.topic, events.Withdrawal.topic]],
    data: {
      evmLog: {
        topics: true,
        data: true,
      },
      transaction: {
        hash: true,
      },
    },
  });

interface Interaction {
  actor: string;
  amount: BigNumber;
  type: "withdrawal" | "deposit";
}

async function getOrCreateWeth(store: Store) {
  let weth0 = await store.get(Weth, "THEONE");

  if (weth0 == null) {
    weth0 = new Weth({
      deposit: "0",
      withdraw: "0",
      id: "THEONE",
    });
  }

  return weth0;
}

function handleDeposit(
  ctx: LogHandlerContext<
    Store,
    { evmLog: { topics: true; data: true }; transaction: { hash: true } }
  >
): Interaction {
  const { evmLog, transaction, block } = ctx;

  const { dst, wad } = events.Deposit.decode(evmLog);

  return {
    actor: dst,
    amount: wad,
    type: "deposit",
  };
}

function handleWithdraw(
  ctx: LogHandlerContext<
    Store,
    { evmLog: { topics: true; data: true }; transaction: { hash: true } }
  >
): Interaction {
  const { evmLog, transaction, block } = ctx;

  const { src, wad } = events.Withdrawal.decode(evmLog);

  return {
    actor: src,
    amount: wad,
    type: "withdrawal",
  };
}

async function saveInteraction(
  ctx: BlockHandlerContext<Store>,
  InteractionData: Interaction[]
) {

  ctx.log.info("enter saveInteraction")

  const wethEntity = await getOrCreateWeth(ctx.store);

  let currentDeposit = wethEntity.deposit;
  let currentWithdrawal = wethEntity.withdraw;

  let cacheDeposit: BigNumber = BigNumber.from("0");
  let cacheWithdrawal: BigNumber = BigNumber.from("0");

  for (const interaction of InteractionData) {
    ctx.log.info("loop interaction")
    if (interaction.type === "deposit") {
      cacheDeposit = cacheDeposit.add(interaction.amount);
    }

    if (interaction.type === "withdrawal") {
      cacheWithdrawal = cacheWithdrawal.add(interaction.amount);
    }
  }

  cacheDeposit = cacheDeposit.add(BigNumber.from(currentDeposit));
  cacheWithdrawal = cacheWithdrawal.add(BigNumber.from(currentWithdrawal));

  ctx.log.info("before calling tokenSupply")

  let supply = await new Contract(
    ctx,
    ctx.block,
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase()
  ).totalSupply();
  
  ctx.log.info("after calling tokenSupply")

  wethEntity.deposit = cacheDeposit.toString();
  wethEntity.withdraw = cacheWithdrawal.toString();
  wethEntity.totalSuppy = supply.toString();

  ctx.log.info("saving interaction")

  await ctx.store.save(wethEntity);
}

processor.run(new TypeormDatabase(), async (ctx) => {
  const interactions: Interaction[] = [];
  for (let c of ctx.blocks) {
    for (let i of c.items) {
      // apply arbitrary data transformation logic here
      // use ctx.store to persist the data
      ctx.log.info("Enter new Item");

      if (i.kind === "evmLog" && i.evmLog.topics[0] === events.Deposit.topic) {
        const depositData = handleDeposit({
          ...ctx,
          block: c.header,
          ...i,
        });

        interactions.push(depositData);
      }

      if (
        i.kind === "evmLog" &&
        i.evmLog.topics[0] === events.Withdrawal.topic
      ) {
        const withdrawalData = handleWithdraw({
          ...ctx,
          block: c.header,
          ...i,
        });

        interactions.push(withdrawalData);
      }
    }
  }

  await saveInteraction(
    {
      ...ctx,
      block: ctx.blocks[ctx.blocks.length - 1].header,
    },
    interactions
  );
});
