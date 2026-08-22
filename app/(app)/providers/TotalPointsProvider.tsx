"use client";

import { createContext, useState, useEffect, ReactNode } from "react";

type TotalPointsContextType = {
  totalPoints: number;
};

type Props = {
  children: ReactNode;
};

export const TotalPointsContext = createContext<TotalPointsContextType>({
  totalPoints: 0,
});

export default function TotalPointsProvider({ children }: Props) {
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const getTotalPoints = async () => {
      try {
        const res = await fetch("http://localhost:8080/fetch_points", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        if (data.points) {
          setTotalPoints(data.points);
        }
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    getTotalPoints();
  }, []);

  return (
    <TotalPointsContext.Provider value={{ totalPoints }}>
      {children}
    </TotalPointsContext.Provider>
  );
}
