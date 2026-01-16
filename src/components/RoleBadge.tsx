import { Badge } from "@/components/ui/badge";
import { Crown, Edit, User, Code, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "editor" | "author" | "developer";

interface RoleBadgeProps {
  role: AppRole | string;
  isVerified?: boolean;
  className?: string;
  showIcon?: boolean;
}

const roleConfig: Record<string, { 
  label: string; 
  bgColor: string; 
  textColor: string;
  icon: typeof Crown;
}> = {
  admin: { 
    label: "Администратор", 
    bgColor: "bg-red-500", 
    textColor: "text-white",
    icon: Crown 
  },
  editor: { 
    label: "Редактор", 
    bgColor: "bg-blue-500", 
    textColor: "text-white",
    icon: Edit 
  },
  author: { 
    label: "Автор", 
    bgColor: "bg-green-500", 
    textColor: "text-white",
    icon: User 
  },
  developer: { 
    label: "Разработчик", 
    bgColor: "bg-purple-600", 
    textColor: "text-white",
    icon: Code 
  },
  user: { 
    label: "Пользователь", 
    bgColor: "bg-gray-500", 
    textColor: "text-white",
    icon: User 
  },
};

export function RoleBadge({ role, isVerified, className, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.user;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Badge className={cn(config.bgColor, config.textColor, "gap-1")}>
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
      {isVerified && (
        <span className="text-red-500" title="Официальный аккаунт">
          <CheckCircle className="w-4 h-4 fill-current" />
        </span>
      )}
    </div>
  );
}
