"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  initialTime: number;
  isActive: boolean;
}

const Timer = ({ initialTime, isActive }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, timeLeft]);

  return <span>{formatTime(timeLeft)}</span>;
};

export default Timer;