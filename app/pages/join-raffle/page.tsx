"use client";

import { useState } from "react";
import { RaffleProps } from "../../utils/_type";
import { _raffleData } from "../../utils/_data";
import RaffleCard from "@/app/components/RaffleCard";
import { Button } from "@nextui-org/react";
import Link from "next/link";

const Page = () => {
  const [sortRaffle, setFilterKey] = useState("all");
  const [raffles, setRaffles] = useState(_raffleData);
  const address =
    "tb1ppzppdpwchlap6v4ez9dytg6mxjpn0ffk5evvrhkznay94aqulcfqxwqlpu";
  const filteredRaffles = raffles.filter((item) => item.owner === address);

  return (
    <div className="grid gap-3 p-3">
      <div>Raffles</div>
      <div className="flex gap-3">
        <Button>All Raffles</Button>
        <Button>My Raffles</Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {filteredRaffles.map((raffle: RaffleProps, index: number) => (
          <Link key={index} href={"/pages/raffle/12"}>
            <RaffleCard raffle={raffle} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Page;
