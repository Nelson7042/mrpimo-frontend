// app/onboarding/layout.tsx
import { PasswordResetProvider } from "@/contexts/PasswordResetContext";
import Stepper from "./(components)/Stepper";
import Navigator from "./(components)/Navigator";


export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordResetProvider>
      <div className="bg-gray-200 px-4 md:px-10 lg:px-20 min-h-screen flex flex-col justify-center items-center">
        <div className="flex justify-between items-center h-[10%] w-full mt-4">
          <Navigator />
          <Stepper />
        </div>
        <div className="flex justify-center items-center flex-1">{children}</div>
      </div>
    </PasswordResetProvider>
  );
}
