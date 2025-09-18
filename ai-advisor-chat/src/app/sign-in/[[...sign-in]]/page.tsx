import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to AI Advisor Chat
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your personal board of AI advisors
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            },
          }}
        />
      </div>
    </div>
  );
}
