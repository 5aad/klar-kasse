import { useLocalSearchParams } from "expo-router";

import { ReceiptDetailContent } from "@/components/receipt/receipt-detail-content";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReceiptDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();

  return <ReceiptDetailContent receiptId={getParamValue(params.id) ?? ""} />;
}
