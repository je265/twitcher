"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import OverviewTab from "../components/OverviewTab";
import AccountsTab from "../components/AccountsTab";
import VideosTab from "../components/VideosTab";
import StreamingTab from "../components/StreamingTab";

const validTabs = ["overview", "accounts", "videos", "streaming"] as const;
type TabType = typeof validTabs[number];

export default function DashboardTabPage() {
  const params = useParams();
  const router = useRouter();
  const tab = params.tab as string;

  // Redirect if invalid tab
  useEffect(() => {
    if (!validTabs.includes(tab as TabType)) {
      router.replace("/dashboard/overview");
    }
  }, [tab, router]);

  if (!validTabs.includes(tab as TabType)) {
    return null;
  }

  const renderTab = () => {
    switch (tab as TabType) {
      case "overview":
        return <OverviewTab />;
      case "accounts":
        return <AccountsTab />;
      case "videos":
        return <VideosTab />;
      case "streaming":
        return <StreamingTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <DashboardLayout activeTab={tab as TabType}>
      {renderTab()}
    </DashboardLayout>
  );
}
