import { createContext, useContext, useEffect, useState } from 'react';

const CompareContext = createContext();
const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('socrateluxe_compare');
    if (saved) setCompareIds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('socrateluxe_compare', JSON.stringify(compareIds));
  }, [compareIds]);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_COMPARE) {
        alert(`You can compare up to ${MAX_COMPARE} products at a time.`);
        return prev;
      }
      return [...prev, id];
    });
  };
  const isComparing = (id) => compareIds.includes(id);
  const clearCompare = () => setCompareIds([]);

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, isComparing, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);