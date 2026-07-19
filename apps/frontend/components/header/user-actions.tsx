import { getUser } from '@/actions/auth';
import { cn } from '@/lib/utils';

import AuthBtn from '../auth/auth-button';

import { CartButtonHeaderWrapper } from '../cart/cart-button-header-wrapper';

interface UserActionsProps {
  compact?: boolean;
  className?: string;
}

export default async function UserActions({
  compact = false,
  className,
}: UserActionsProps) {
  const user = await getUser();

  return (
    <div
      className={cn(
        'flex items-center text-white',
        compact ? 'gap-3' : 'gap-5',
        className
      )}
    >
      <AuthBtn user={user} compact={compact} />
      <CartButtonHeaderWrapper compact={compact} />
    </div>
  );
}
