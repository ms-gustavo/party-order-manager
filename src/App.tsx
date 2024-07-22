import React, { useState, useEffect } from "react";
import SharedOrder from "./components/SharedOrder";
import IndividualOrder from "./components/IndividualOrder";
import TotalOrder from "./components/TotalOrder";

const App: React.FC = () => {
  const [sharedOrders, setSharedOrders] = useState<
    { item: string; amount: number; quantity: number }[]
  >([]);
  const [individualOrders, setIndividualOrders] = useState<
    { name: string; orders: { item: string; amount: number }[] }[]
  >([]);

  useEffect(() => {
    const savedSharedOrders = localStorage.getItem("sharedOrders");
    const savedIndividualOrders = localStorage.getItem("individualOrders");

    if (savedSharedOrders) {
      setSharedOrders(JSON.parse(savedSharedOrders));
    }
    if (savedIndividualOrders) {
      setIndividualOrders(JSON.parse(savedIndividualOrders));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sharedOrders", JSON.stringify(sharedOrders));
  }, [sharedOrders]);

  useEffect(() => {
    localStorage.setItem("individualOrders", JSON.stringify(individualOrders));
  }, [individualOrders]);

  const resetOrders = () => {
    setSharedOrders([]);
    setIndividualOrders([]);
    localStorage.removeItem("sharedOrders");
    localStorage.removeItem("individualOrders");
    localStorage.removeItem("people");
  };

  return (
    <div
      id="app-container"
      className="container mx-auto p-6 bg-gray-100 min-h-screen"
    >
      <h1
        id="app-container-header"
        className="text-4xl font-bold mb-6 text-center text-blue-600"
      >
        Gerenciador de Comanda
      </h1>
      <button
        id="reset-orders-button"
        onClick={resetOrders}
        className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200 mb-6 mx-auto block"
      >
        Zerar Dados
      </button>
      <div id="orders-container" className="flex flex-col lg:flex-row gap-6">
        <div
          id="shared-order-container"
          className="flex-1 p-4 bg-white shadow-lg rounded-lg"
        >
          <SharedOrder
            sharedOrders={sharedOrders}
            setSharedOrders={setSharedOrders}
          />
        </div>
        <div
          id="individual-order-container"
          className="flex-1 p-4 bg-white shadow-lg rounded-lg"
        >
          <IndividualOrder
            individualOrders={individualOrders}
            setIndividualOrders={setIndividualOrders}
          />
        </div>
      </div>
      <div
        id="total-order-container"
        className="mt-6 p-4 bg-white shadow-lg rounded-lg"
      >
        <TotalOrder
          sharedOrders={sharedOrders}
          individualOrders={individualOrders}
        />
      </div>
    </div>
  );
};

export default App;
