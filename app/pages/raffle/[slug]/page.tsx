"use client";

import { useContext, useEffect, useState } from "react";
import type { SignTransactionOptions } from "sats-connect";
import { BitcoinNetworkType, signTransaction } from "sats-connect";
import { Button, Input } from "@nextui-org/react";
import { _raffleData } from "@/app/utils/_data";
import { useParams } from "next/navigation";
import Image from "next/image";
import { RaffleProps } from "@/app/utils/_type";
import { fetchRaffles } from "@/app/hooks/use-raffle";
import WalletContext from "@/app/contexts/WalletContext";
import { buyTickets, preBuyTickets } from "@/app/hooks/use-ticket";
import { WalletTypes } from "@/app/utils/utils";

const Page = () => {
  const { slug } = useParams();
  const {
    ordinalAddress,
    walletType,
    paymentPublicKey,
    ordinalPublicKey,
    paymentAddress,
  } = useContext(WalletContext);

  const [raffle, setRaffle] = useState<RaffleProps>();
  const [ticketCounts, setTicketCounts] = useState<string>("");

  const getRaffles = async () => {
    const resp = await fetchRaffles();
    setRaffle(
      resp.raffles.find((item: RaffleProps) => item.ordinalInscription === slug)
    );
  };

  useEffect(() => {
    getRaffles();
  }, []);

  const handleBuyTickets = async () => {
    const tCounts = Number(ticketCounts);
    const currentWindow: any = window;
    const unisat: any = currentWindow?.unisat;
    const buyerPayPubkey = paymentPublicKey;
    const buyerOrdinalPubkey = ordinalPublicKey;
    const buyerOrdinalAddress = ordinalAddress;
    console.log(buyerPayPubkey, buyerOrdinalPubkey, walletType);
    if (raffle && tCounts > 0) {
      console.log(raffle, tCounts);
      const resp = await preBuyTickets({
        buyerPayPubkey,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        ticketCounts: tCounts,
        _id: raffle._id,
        walletType,
      });
      console.log(resp);
      if (resp.psbtHex) {
        let signedPSBT;
        switch (walletType) {
          case WalletTypes.UNISAT:
            signedPSBT = await unisat.signPsbt(resp.psbtHex);
            break;
          case WalletTypes.XVERSE:
            const signPsbtOptions: SignTransactionOptions = {
              payload: {
                network: {
                  type: BitcoinNetworkType.Testnet,
                },
                message: "Sign Transaction",
                psbtBase64: resp.psbtBase64,
                broadcast: false,
                inputsToSign: [
                  {
                    address: paymentAddress,
                    signingIndexes: resp.buyerPaymentsignIndexes,
                  },
                ],
              },
              onFinish: (response: any) => {
                console.log(response);
                signedPSBT = response.psbtBase64;
              },
              onCancel: () => alert("Canceled"),
            };

            await signTransaction(signPsbtOptions);
            break;
          case WalletTypes.HIRO:
            const requestParams = {
              publicKey: paymentPublicKey,
              hex: resp.psbtHex,
              network: "testnet",

              signAtIndex: resp.buyerPaymentsignIndexes,
            };
            const result = await window.btc?.request("signPsbt", requestParams);
            signedPSBT = (result as any).result.hex;
        }
        const response = await buyTickets({
          _id: raffle._id,
          buyerOrdinalAddress,
          psbt: resp.psbtHex,
          signedPSBT,
          ticketCounts: tCounts,
          walletType,
        });
        console.log(response);
      }
    }
  };

  return (
    <div className="grid gap-3 p-3">
      <div>Raffle Info</div>
      <div>
        {raffle && (
          <div className="grid gap-3">
            <div className="flex gap-3">
              <span>Wallet Type : </span>
              <span>{raffle.walletType}</span>
            </div>
            <div className="flex gap-3">
              <span>Tickets : </span>
              <span>{raffle?.ticketList?.length}</span>
            </div>
            <div className="flex gap-3">
              <span>Ticket Creator : </span>
              <span>{raffle.creatorOrdinalAddress}</span>
            </div>
            <div className="flex gap-3">
              <span>Ticket Price : </span>
              <span>{raffle.ticketPrice}</span>
            </div>
            <Image
              alt="Card background"
              className="object-cover rounded-xl"
              width={300}
              height={300}
              src={`${process.env.NEXT_PUBLIC_ORDINAL_URL}/${slug}`}
            />
            <div className="flex gap-5">
              <Input
                placeholder="Ticket Counts"
                value={ticketCounts}
                onChange={(e) => setTicketCounts(e.target.value)}
              />
              <Button onClick={() => handleBuyTickets()}>Buy Tickets</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
