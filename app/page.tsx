"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import Notiflix from "notiflix";
import type { Capability, SignTransactionOptions } from "sats-connect";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
  signTransaction,
} from "sats-connect";
import { type BtcAddress } from "@btckit/types";
import OrdinalCard from "@/app/components/OrdinalCard";
import { _raffleData } from "./utils/_data";
import { fetchInscriptions } from "./hooks/use-inscription";

import Checked from "@/app/assets/check.svg";
import Image from "next/image";
import WalletContext from "./contexts/WalletContext";
import { preCreateRaffle, createRaffle } from "./hooks/use-raffle";
import { WalletTypes } from "./utils/utils";

export default function Page() {
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketAmount, setTicketAmount] = useState("");
  const [ticketDeadline, setTicketDeadline] = useState("");
  // const [sortRaffle, setFilterKey] = useState('all')
  const [raffles, setRaffles] = useState<any[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);

  const {
    walletType,
    ordinalAddress,
    paymentAddress,
    ordinalPublicKey,
    setWalletType,
    setOrdinalAddress,
    setPaymentAddress,
    setPaymentPublicKey,
    setOrdinalPublicKey,
  } = useContext(WalletContext);

  const isConnected = Boolean(ordinalAddress);

  const handleConnectWallet = async () => {
    const currentWindow: any = window;
    if (typeof currentWindow?.unisat !== "undefined") {
      const unisat: any = currentWindow?.unisat;
      try {
        let accounts: string[] = await unisat.requestAccounts();
        let pubkey = await unisat.getPublicKey();
        Notiflix.Notify.success("Connect succes!");
        setWalletType(WalletTypes.UNISAT);
        setOrdinalAddress(accounts[0] || "");
        setPaymentAddress(accounts[0] || "");
        setOrdinalPublicKey(pubkey);
        setPaymentPublicKey(pubkey);
      } catch (e) {
        Notiflix.Notify.failure("Connect failed!");
      }
    }
  };

  const xverseConnectWallet = async () => {
    await getAddress({
      payload: {
        purposes: [
          AddressPurpose.Ordinals,
          AddressPurpose.Payment,
          AddressPurpose.Stacks,
        ],
        message: "Ordinal Raffle Site",
        network: {
          type: BitcoinNetworkType.Testnet,
        },
      },
      onFinish: (response) => {
        setWalletType(WalletTypes.XVERSE);
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment
        );
        setPaymentAddress(paymentAddressItem?.address as string);
        setPaymentPublicKey(paymentAddressItem?.publicKey as string);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals
        );
        setOrdinalAddress(ordinalsAddressItem?.address as string);
        setOrdinalPublicKey(ordinalsAddressItem?.publicKey as string);
      },
      onCancel: () => alert("Request canceled"),
    });
  };

  const leaderConnectWallet = async () => {
    try {
      const currentWindow: any = window;
      const addressesRes = await currentWindow.btc?.request("getAddresses", {});
      const { address, publicKey } = (
        addressesRes as any
      ).result.addresses.find((address: BtcAddress) => address.type === "p2tr");

      const { address: paymentAddress, publicKey: paymentPublickey } = (
        addressesRes as any
      ).result.addresses.find(
        (address: BtcAddress) => address.type === "p2wpkh"
      );

      setWalletType(WalletTypes.HIRO);
      console.log(paymentAddress, paymentPublickey, address, publicKey);
      setPaymentAddress(paymentAddress);
      setPaymentPublicKey(paymentPublickey);
      setOrdinalAddress(address);
      setOrdinalPublicKey(publicKey);
      alert("connected");
    } catch (err) {
      alert("cancelled");
    }
  };

  const handleCreate = async () => {
    if (selectedRaffle) {
      const resp = await preCreateRaffle(
        selectedRaffle?.inscriptionId,
        paymentAddress,
        ordinalPublicKey,
        walletType
      );
      let signedPSBT;
      switch (walletType) {
        case WalletTypes.UNISAT:
          const currentWindow: any = window;
          const unisat: any = currentWindow?.unisat;
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
                  address: ordinalAddress,
                  signingIndexes: [0],
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
            publicKey: ordinalPublicKey,
            hex: resp.psbtHex,
            network: "testnet",

            signAtIndex: [0],
          };
          const result = await window.btc?.request("signPsbt", requestParams);
          signedPSBT = (result as any).result.hex;
      }

      console.log("we are here", signedPSBT);

      const response = await createRaffle({
        ticketPrice: Number(ticketPrice),
        ticketAmounts: Number(ticketAmount),
        endTime: 60 * Number(ticketDeadline),
        ordinalInscription: selectedRaffle?.inscriptionId,
        creatorOrdinalAddress: ordinalAddress,
        creatorPaymentAddress: paymentAddress,
        psbt: resp.psbtHex,
        signedPSBT,
        walletType,
      });
      console.log(response);
      Notiflix.Notify.success("Raffle Created");
    } else {
      Notiflix.Notify.failure("Please Select Raffle");
    }
  };

  const getInscriptions = async () => {
    const inscriptions = await fetchInscriptions(ordinalAddress);
    const allInscriptions = inscriptions?.data?.inscription;
    if (allInscriptions) {
      setRaffles(allInscriptions.filter((item: any) => item.brc20 === null));
    }
  };

  useEffect(() => {
    ordinalAddress && getInscriptions();
  }, [ordinalAddress]);

  const handleClick = (raffle: any) => {
    if (selectedRaffle === raffle) {
      setSelectedRaffle(null);
    } else {
      setSelectedRaffle(raffle);
    }
  };

  return (
    <div className="p-2">
      {isConnected ? (
        <div>My Account: {ordinalAddress}</div>
      ) : (
        <div className="flex flex-col gap-2 justify-center items-center">
          <Button onClick={() => handleConnectWallet()}>
            Unisat Wallet Connect
          </Button>
          <Button onClick={() => xverseConnectWallet()}>
            XVerse Wallet Connect
          </Button>
          <Button onClick={() => leaderConnectWallet()}>
            Leader Wallet Connect
          </Button>
        </div>
      )}
      {isConnected && (
        <div className="grid grid-cols-[5fr_1fr] mt-10">
          <div className="grid gap-10 text-center">
            <div>My Ordinals</div>
            <div className="grid grid-cols-4 gap-5">
              {raffles.map((raffle: any, index: number) => {
                const checked = selectedRaffle === raffle;
                return (
                  <div
                    key={index}
                    onClick={() => handleClick(raffle)}
                    className={`relative rounded-lg`}
                  >
                    {checked && (
                      <div className="absolute top-0 left-0 z-10 w-full h-full rounded-lg">
                        <div className="w-full h-full bg-slate-800 opacity-50 rounded-lg"></div>
                        <Image
                          className="absolute -top-2 -right-2"
                          src={Checked}
                          width={20}
                          height={20}
                          alt="raffle"
                        />
                      </div>
                    )}
                    <OrdinalCard ordinal={raffle} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-5">Create Raffle</div>
            <div className="grid gap-5">
              <div>
                <Input
                  placeholder="Ticket Price"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Ticket Amount"
                  value={ticketAmount}
                  onChange={(e) => setTicketAmount(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Deadline ( mins )"
                  value={ticketDeadline}
                  onChange={(e) => setTicketDeadline(e.target.value)}
                />
              </div>
              <div>
                <Button onClick={() => handleCreate()}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
