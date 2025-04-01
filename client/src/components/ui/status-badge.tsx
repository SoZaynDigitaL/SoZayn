import { Badge } from "@/components/ui/badge";
import { cva } from "class-variance-authority";

const statusVariants = cva("", {
  variants: {
    status: {
      processing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      in_transit: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      delivered: "bg-green-100 text-green-800 hover:bg-green-100",
      failed: "bg-red-100 text-red-800 hover:bg-red-100",
      cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    },
  },
  defaultVariants: {
    status: "processing",
  },
});

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Map status to display text
  const getDisplayText = (status: string) => {
    switch (status) {
      case "processing":
        return "Processing";
      case "in_transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={statusVariants({ status: status as any })}
    >
      {getDisplayText(status)}
    </Badge>
  );
}
