import { concat, createWalletClient, Hex, http, size, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { kinto } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const BUNDLE_BULKER_ADDRESS = "0x8d2D899402ed84b6c0510bB1ad34ee436ADDD20d";
const PER_OP_INFLATOR_ID = 1n;
const NUMBER_OF_USER_OPS = 1n;
const KINTO_INFLATOR_ID = 1n;

const main = async () => {
	const pk = process.env.PRIVATE_KEY;

	if (!pk) {
		throw new Error("PRIVATE_KEY not set");
	}

	const walletClient = createWalletClient({
		chain: kinto,
		transport: http(
			"https://kinto-mainnet.calderachain.xyz/infra-partner-http",
		),
		account: privateKeyToAccount(pk as Hex),
	});

	// builtin node.js module
	const readline = require("readline");

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question("Enter compressed calldata:\n> ", async (compressed: string) => {
		compressed = compressed.replace(/\s+/g, "");
		const compressedLength = size(compressed as Hex);

		const bundleBulkerCalldata = concat([
			toHex(PER_OP_INFLATOR_ID, { size: 4 }),
			toHex(NUMBER_OF_USER_OPS, { size: 1 }),
			toHex(KINTO_INFLATOR_ID, { size: 4 }),
			toHex(compressedLength, { size: 2 }),
			compressed as Hex,
		]);

		const hash = await walletClient.sendTransaction({
			to: BUNDLE_BULKER_ADDRESS,
			data: bundleBulkerCalldata,
			gas: 5_000_000n,
		});

		console.log(`\nhttps://explorer.kinto.xyz/tx/${hash}`);

		rl.close();
	});
};

main();
