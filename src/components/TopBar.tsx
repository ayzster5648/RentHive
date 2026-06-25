import { GlobalSearch } from "./GlobalSearch";
import { NotificationsBell, type Notification } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";

export function TopBar({
  userName,
  userEmail,
  notifications,
}: {
  userName: string;
  userEmail: string;
  notifications: Notification[];
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-4">
        <NotificationsBell notifications={notifications} />
        <ProfileMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
