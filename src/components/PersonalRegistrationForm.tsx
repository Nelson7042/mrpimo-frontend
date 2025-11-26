"use client";
import React, { useState } from "react";
import Input from "./Input";
import PhoneNumberInput from "./PhoneNumberInput";
import { useSignUp } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { toastConfigSuccess, toastConfigError } from "@/app/config/toast.config";
import VerificationSkeleton from "@/skeletons/VerificationSkeleton";

type Props = {};

const PersonalRegistrationForm = (props: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    password: "",
    phoneNumber: "",
    email: "",
  });
  const router = useRouter();

  const { mutate: signUpUser, isPending } = useSignUp();
  const {setUser} = useUserStore();

  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      password: "",
      phoneNumber: "",
      email: "",
    };

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }
    if (!phone.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (firstName && firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters long.";
    }

    if (firstName && !/^[a-zA-Z]+$/.test(firstName)) {
      newErrors.firstName = "First name can only contain letters.";
    }

    if (firstName && firstName.trim().split(" ").length > 1) {
      newErrors.firstName = "First name should not contain spaces.";
    }

    if (lastName && lastName.trim().split(" ").length > 1) {
      newErrors.lastName = "Last name should not contain spaces.";
    }

    if (lastName && !/^[a-zA-Z]+$/.test(lastName)) {
      newErrors.lastName = "Last name can only contain letters.";
    }

    if (lastName && lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters long.";
    }

    if (phone && !/^\+(?:[0-9] ?){6,14}[0-9]$/.test(phone)) {
        console.log(phone);
        newErrors.phoneNumber = 'Phone number is invalid. Format: +234 8051234567';
      }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid.";
    }

    if (password && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Perform validation and submit the form if valid
    if (validateForm()) {
      // Submit the form
      console.log("Form submitted successfully!");
      const userData = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber: phone,
      };
      signUpUser(userData, {
        onSuccess: (data) => {
          toast.success(data.message, toastConfigSuccess);
          setUser(data.user);
          setFirstName("");
          setLastName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setErrors({
            firstName: "",
            lastName: "",
            password: "",
            phoneNumber: "", 
            email: "",
          });
          setRedirecting(true);
          router.replace("/email-verification");
        },
        onError: (error) => {
          toast.error(error.message, toastConfigError);
        },
      });
    }
  };

  // Return the skeleton if redirecting
  if (redirecting) {
    return <VerificationSkeleton />;
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        label="First Name"
        id="first-name"
        placeholder="Type your First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={errors.firstName}
      />
      <Input
        label="Last Name"
        id="last-name"
        placeholder="Type your Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={errors.lastName}
      />
      <Input
        label="Email Address"
        id="email"
        placeholder="Type your Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <PhoneNumberInput
        error={errors.phoneNumber}
        onChange={setPhone}
        value={phone}
      />
      <Input
        label="Password"
        id="password"
        placeholder="Type your Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        error={errors.password}
      />
      <button
        type="submit"
        className="bg-[#5187f6] hover:[#5187f6]/90 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline w-full cursor-pointer transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        {isPending ? "Registering Account..." : "Register Personal Account"}
      </button>
    </form>
  );
};

export default PersonalRegistrationForm;