"use client";

import { useState, useEffect, useContext } from "react";
import { _raffleData } from "../../utils/_data";
import Link from "next/link";
import { fetchRaffleHistory } from "@/app/hooks/use-raffle";
import WalletContext from "@/app/contexts/WalletContext";
import RaffleCard from "@/app/components/RaffleCard";
import { RaffleProps } from "@/app/utils/_type";

const Page = () => {
  const { ordinalAddress } = useContext(WalletContext);
  const [raffles, setRaffles] = useState([]);
  const getHistoryRaffles = async () => {
    const resp = await fetchRaffleHistory(ordinalAddress);
    console.log(resp);
    setRaffles(resp.raffles);
  };

  useEffect(() => {
    getHistoryRaffles();
  }, []);
  return (
    <div className="grid gap-3 p-3">
      <div>History</div>
      <div className="flex gap-3">
        <Link href={`/pages/raffle`}>All Raffles</Link>
        <Link href={`/pages/history-raffle`}>History Raffles</Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {raffles.map((raffle: RaffleProps, index: number) => (
          <RaffleCard raffle={raffle} />
        ))}
      </div>
    </div>
  );
};

export default Page;
