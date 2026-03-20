export const dynamic = 'force-dynamic';

import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import nextDynamic from "next/dynamic";

const Chat = nextDynamic(() => import("@/components/Chat"), {
  ssr: false,
});

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error();
  }

  return (
    <div className={"grow flex flex-col"}>
      <Chat accessToken={accessToken} />
    </div>
  );
}
