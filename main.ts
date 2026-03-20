import { getHumeAccessToken } from "./utils/getHumeAccessToken";

async function main() {
    console.log(await getHumeAccessToken())
}

main();
