import React from "react";
import { auth } from "@/auth";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const session = await auth();

  return <SidebarClient session={session} />;
}
