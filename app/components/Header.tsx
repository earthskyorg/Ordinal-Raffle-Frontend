"use client";

import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { pages } from "../utils/_data";

const Header = () => {
  const router = useRouter();
  const gotoPage = (route: string) => {
    router.push(route);
  };
  return (
    <div className="p-3 flex gap-3">
      {pages.map((page, index) => (
        <Button
          key={`raffle-page-${index}`}
          onClick={() => gotoPage(page.route)}
        >
          {page.label}
        </Button>
      ))}
    </div>
  );
};

export default Header;
