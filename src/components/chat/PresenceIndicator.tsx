"use client";

interface PresenceIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PresenceIndicator({ isOnline, size = "sm", className = "" }: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  const bgColor = isOnline ? "bg-green-500" : "bg-gray-400";

  return (
    <div className={`${sizeClasses[size]} ${bgColor} rounded-full border border-white ${className}`} />
  );
}

// Component for showing user presence in conversation lists
export function UserPresenceList({ users }: { users: Array<{ name: string | null; isOnline: boolean; image?: string | null }> }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500">
      <div className="flex -space-x-1">
        {users.slice(0, 3).map((user, index) => (
          <div key={index} className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-5 h-5 rounded-full border border-white"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <PresenceIndicator 
              isOnline={user.isOnline} 
              size="sm" 
              className="absolute -bottom-0.5 -right-0.5" 
            />
          </div>
        ))}
      </div>
      {users.length > 3 && (
        <span className="text-xs text-gray-400">+{users.length - 3}</span>
      )}
    </div>
  );
}
