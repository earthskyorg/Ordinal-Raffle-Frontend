"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/react";
import Image from "next/image";
// import Penguin from "@/app/assets/penguin.png";

const OrdinalCard = ({ ordinal }: { ordinal: any }) => {
  return (
    <Card className="relative py-4 cursor-pointer">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-tiny uppercase font-bold">{ordinal.name}</p>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          width={300}
          height={300}
          src={`${process.env.NEXT_PUBLIC_ORDINAL_URL}/${ordinal.inscriptionId}`}
        />
      </CardBody>
    </Card>
  );
};

export default OrdinalCard;
