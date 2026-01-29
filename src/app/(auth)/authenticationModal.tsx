"use client";

import Modal2 from "@/components/Modal2";
import { ArrowBigRightIcon, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import LoginForm from "./(component)/LoginForm";
import RegisterForm from "./(component)/RegisterForm";
import RecoverPass from "./(component)/RecoverPass";
import OTPModal from "./(component)/Otp";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "@/utils/config";
import Link from "next/link";

type ModalProps = {
  isOpen: boolean;
  close: () => void;
};

const AuthenticationModal = ({ isOpen, close }: ModalProps) => {
  const { user } = useUserStore();
  const { closeModal } = useAuthModalStore();
  const [signState, setSignState] = React.useState<"login" | "register">(
    "login"
  );
  const [authState, setAuthState] = useState<"login" | "recover" | "otp">(
    "login"
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      window.location.href = `${API_BASE_URL}/auth/google`;
    } catch (error) {
      setIsGoogleLoading(false);
    }
  };

  // Close modal if user is logged in AND email is verified
  useEffect(() => {
    if (user && user.isEmailVerified && isOpen) {
      console.log('✅ User logged in and verified, closing modal');
      closeModal();
      close();
    }
  }, [user, isOpen, closeModal, close]);

  // Don't render modal if user is logged in AND email is verified
  if (user && user.isEmailVerified) {
    return null;
  }

  const Login = () => {
    return (
      <div>
        <div className="py-4 flex justify-between mb-[16px] md:mb-[24px] lg-[40px] w-full ">
          <h3 className="text-[14px] flex-1   md:text-[20px] md:leading-[24px]  text-gray-700 font-semibold">
            Log in or Create an Account to Continues
          </h3>

          <X onClick={close} className="cursor-pointer text-black" size={20} />
        </div>

        <ul className="flex  items-center  mb-6 md:mb-8 w-full">
          <li
            onClick={() => setSignState("login")}
            className={`cursor-pointer flex-1 text-sm  border-b md:text-base text-center  font-semibold ${
              signState === "login"
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-b border-[#E4E7E9]"
            }`}
          >
            Sign in
          </li>
          <li
            onClick={() => setSignState("register")}
            className={`cursor-pointer flex-1 text-sm md:text-base text-center font-semibold ${
              signState === "register"
                ? "text-blue-600 border-b border-blue-600"
                : "text-gray-500 border-b border-[#E4E7E9]"
            }`}
          >
            Sign Up
          </li>
        </ul>

        {
          <div>
            {signState === "login" ? (
              <LoginForm setAuthState={setAuthState} close={close} />
            ) : (
              <RegisterForm setAuthState={setAuthState} close={close} />
            )}
          </div>
        }
      </div>
    );
  };
  const Recover = () => {
    return (
      <div>
        <div className="py-3 flex justify-between mb-[10px]   ">
          <h3 className="text-[14px] flex-1  text-center   md:text-[20px] md:leading-[24px]  text-gray-700 font-semibold">
            Recover Account{" "}
          </h3>

          <X onClick={close} className="cursor-pointer text-black" size={20} />
        </div>
        <p className="text-xs text-black text-center mb-[10px] md:mb-[24px]">
          Provide your registered email address to recover your password
        </p>
        <RecoverPass />
        <button
          onClick={() => setAuthState("login")}
          className=" text-primary flex items-center gap-1 "
        >
          <span>Back to Login</span>
          <ArrowBigRightIcon size={14} />
        </button>
      </div>
    );
  };

  return (
    <div>
      <Modal2 isOpen={isOpen} onClose={close}>
        <div className="inline-block overflow-hidden mt-12  bg-white text-left relative align-bottom transition-all transform  rounded-lg shadow-xl sm:my-8 sm:align-middle w-full sm:max-w-[550px] sm:w-full p-4 md:p-6">
          {authState === "login" && <Login />}
          {authState === "recover" && <Recover />}
          {authState === "otp" && (
            <OTPModal setAuthState={setAuthState} close={close} />
          )}

          {(authState === "login" || authState === "recover") && (
            <>
              <div className="relative  border-b-2 border-gray-300 w-full mx-auto mb-4">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500">
                  or
                </div>
              </div>

              <div className=" mt-5 md:mt-8 flex flex-col gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className={`w-full py-2 md:py-3 text-sm text-center px-4 flex items-center justify-center  bg-[#F6B76F]  text-[#121212] rounded-md hover:bg-[#F5A94E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 31 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M27.7569 12.5519H26.75V12.5H15.5V17.5H22.5644C21.5338 20.4106 18.7644 22.5 15.5 22.5C11.3581 22.5 8 19.1419 8 15C8 10.8581 11.3581 7.5 15.5 7.5C17.4119 7.5 19.1513 8.22125 20.4756 9.39937L24.0112 5.86375C21.7787 3.78312 18.7925 2.5 15.5 2.5C8.59688 2.5 3 8.09688 3 15C3 21.9031 8.59688 27.5 15.5 27.5C22.4031 27.5 28 21.9031 28 15C28 14.1619 27.9137 13.3438 27.7569 12.5519Z"
                      fill="#FFC107"
                    />
                    <path
                      d="M4.44116 9.18188L8.54804 12.1938C9.65929 9.4425 12.3505 7.5 15.4999 7.5C17.4118 7.5 19.1512 8.22125 20.4755 9.39937L24.0112 5.86375C21.7787 3.78312 18.7924 2.5 15.4999 2.5C10.6987 2.5 6.53491 5.21062 4.44116 9.18188Z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M15.5 27.4999C18.7287 27.4999 21.6625 26.2643 23.8806 24.2549L20.0118 20.9812C18.7149 21.9681 17.1297 22.5017 15.5 22.4999C12.2487 22.4999 9.48808 20.4268 8.44808 17.5337L4.37183 20.6743C6.44058 24.7224 10.6418 27.4999 15.5 27.4999Z"
                      fill="#4CAF50"
                    />
                    <path
                      d="M27.7569 12.5519H26.75V12.5H15.5V17.5H22.5644C22.0714 18.8853 21.1833 20.0957 20.01 20.9819L20.0119 20.9806L23.8806 24.2544C23.6069 24.5031 28 21.25 28 15C28 14.1619 27.9137 13.3438 27.7569 12.5519Z"
                      fill="#1976D2"
                    />
                  </svg>

                  <span className="ml-2">
                    {isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
                  </span>
                </button>

                <button
                  // onClick={action}
                  className={`w-full py-2 md:py-3 text-sm text-center px-4 flex items-center justify-center border  border-[#F6B76F]  text-[#121212] rounded-md`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.1813 3.0025C20.1813 4.2825 19.6313 5.5625 18.8538 6.485C18.0288 7.5075 16.6012 8.2675 15.4663 8.2675C15.3363 8.2675 15.2063 8.25 15.1262 8.235C15.0967 8.08592 15.0808 7.93446 15.0787 7.7825C15.0787 6.485 15.7437 5.205 16.4563 4.395C17.3637 3.3425 18.8688 2.5475 20.1338 2.5C20.1663 2.645 20.1813 2.825 20.1813 3.0025ZM24.6425 11.065L24.705 11.0238C23.0187 8.6075 20.4587 8.5425 19.7463 8.5425C18.6562 8.5425 17.68 8.93 16.86 9.255C16.2662 9.49 15.7537 9.6925 15.3387 9.6925C14.88 9.6925 14.355 9.48 13.7688 9.245C13.0288 8.945 12.1938 8.6075 11.2713 8.6075C8.16 8.6075 5 11.1875 5 16.0462C5 19.0763 6.1675 22.27 7.6125 24.325C8.86 26.075 9.945 27.5 11.5 27.5C12.2375 27.5 12.7788 27.2712 13.3475 27.03C13.9775 26.7625 14.6425 26.48 15.6475 26.48C16.665 26.48 17.2725 26.745 17.8575 27C18.4038 27.2375 18.9288 27.4675 19.7487 27.4675C21.4487 27.4675 22.5662 25.93 23.6362 24.39C24.8363 22.64 25.34 20.9225 25.355 20.8425C25.2575 20.81 21.9988 19.4963 21.9988 15.7862C21.9988 12.7987 24.22 11.3425 24.6425 11.065Z"
                      fill="black"
                    />
                  </svg>

                  <span className="ml-2">Sign in with Apple</span>
                </button>
              </div>

              <div className="text-xs text-gray-500  mt-2">
                Don't have an account?{" "}
                <span
                  onClick={() => setSignState("register")}
                  className="text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Sign Up
                </span>
              </div>
            </>
          )}
        </div>
      </Modal2>
    </div>
  );
};

export default AuthenticationModal;
