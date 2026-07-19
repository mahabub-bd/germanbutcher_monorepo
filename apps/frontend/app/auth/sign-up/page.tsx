'use client';

import SignUpForm from '@/components/auth/sign-up-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegisterForm() {
  return (
    <div className="w-sm md:w-md lg:w-lg mx-auto md:p-8 p-4 shadow-2xl rounded-lg">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-center text-primaryColor">
          Welcome to German Butcher
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          Fill in your details to create a new account
        </p>
      </div>

      <div className="p-2">
        <SignUpForm />
      </div>

      <p className="text-sm text-muted-foreground text-center mt-4">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="ml-1">
          <Button variant="link" className="p-0 h-auto font-medium bg">
            Sign in
          </Button>
        </Link>
      </p>
    </div>
  );
}
