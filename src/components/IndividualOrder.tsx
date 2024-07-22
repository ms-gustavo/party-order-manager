import React, { useState } from "react";
import PersonOrder from "./PersonOrder";

interface IndividualOrderProps {
  individualOrders: {
    name: string;
    orders: { item: string; amount: number }[];
  }[];
  setIndividualOrders: React.Dispatch<
    React.SetStateAction<
      { name: string; orders: { item: string; amount: number }[] }[]
    >
  >;
}

const IndividualOrder: React.FC<IndividualOrderProps> = ({
  individualOrders,
  setIndividualOrders,
}) => {
  const [personName, setPersonName] = useState<string>("");

  const addPerson = () => {
    setIndividualOrders([
      ...individualOrders,
      { name: personName, orders: [] },
    ]);
    setPersonName("");
  };

  const addOrder = (personIndex: number, item: string, amount: number) => {
    const updatedOrders = [...individualOrders];
    updatedOrders[personIndex].orders.push({ item, amount });
    setIndividualOrders(updatedOrders);
  };

  const removePerson = (personIndex: number) => {
    const updatedOrders = individualOrders.filter(
      (_, index) => index !== personIndex
    );
    setIndividualOrders(updatedOrders);
  };

  const calculateTotal = (orders: { item: string; amount: number }[]) => {
    return orders.reduce((total, order) => total + order.amount, 0);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Pedidos por pessoa</h1>
      <div className="mb-4">
        <input
          id="individual-person-name"
          type="text"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="Nome da pessoa"
          className="border p-2 rounded w-full mb-2"
        />
        <button
          id="individual-person-add-button"
          onClick={addPerson}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
        >
          Criar
        </button>
      </div>
      {individualOrders.map((person, index) => (
        <PersonOrder
          person={person}
          personIndex={index}
          addOrder={addOrder}
          calculateTotal={calculateTotal}
          removePerson={removePerson}
        />
      ))}
    </div>
  );
};

export default IndividualOrder;
