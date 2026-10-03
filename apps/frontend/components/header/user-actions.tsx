import { getUser } from '@/actions/auth';
import { cn } from '@/lib/utils';

import AuthBtn from '../auth/auth-button';
import { CartModalWrapper } from '../cart/cart-modal-wrapper';



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
        compact ? 'gap-3' : 'gap-4',
        className
      )}
    >
      <AuthBtn user={user} compact={compact} />
      {!compact && (
        <span
          className='hidden lg:block h-8 w-px bg-white/25'
          aria-hidden='true'
        />
      )}
      <CartModalWrapper compact={compact} />
    </div>
  );
}
