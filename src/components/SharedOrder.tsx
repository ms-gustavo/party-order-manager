import React, { useState, useEffect } from "react";

interface SharedOrderProps {
  sharedOrders: { item: string; amount: number; quantity: number }[];
  setSharedOrders: React.Dispatch<
    React.SetStateAction<{ item: string; amount: number; quantity: number }[]>
  >;
}

const SharedOrder: React.FC<SharedOrderProps> = ({
  sharedOrders,
  setSharedOrders,
}) => {
  const [item, setItem] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [people, setPeople] = useState<number>(1);

  useEffect(() => {
    const savedPeople = localStorage.getItem("people");
    if (savedPeople) {
      setPeople(Number(savedPeople));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("people", String(people));
  }, [people]);

  const addOrder = () => {
    const existingOrderIndex = sharedOrders.findIndex(
      (order) => order.item === item
    );
    if (existingOrderIndex !== -1) {
      const updatedOrders = [...sharedOrders];
      updatedOrders[existingOrderIndex].amount += amount;
      updatedOrders[existingOrderIndex].quantity += 1;
      setSharedOrders(updatedOrders);
    } else {
      setSharedOrders([...sharedOrders, { item, amount, quantity: 1 }]);
    }
    setItem("");
    setAmount(0);
  };

  const incrementOrder = (index: number) => {
    const updatedOrders = [...sharedOrders];
    updatedOrders[index].amount +=
      updatedOrders[index].amount / updatedOrders[index].quantity;
    updatedOrders[index].quantity += 1;
    setSharedOrders(updatedOrders);
  };

  const totalAmount = sharedOrders.reduce(
    (total, order) => total + order.amount,
    0
  );

  return (
    <div>
      <h1 id="shared-order-header" className="text-xl font-bold mb-4">
        Pedidos para ratear entre todos
      </h1>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Quantidade de pessoas:</h3>
        <input
          id="people-quantity-input"
          type="number"
          value={people}
          onChange={(e) => setPeople(Number(e.target.value))}
          placeholder="Número de pessoas"
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="mb-4">
        <input
          id="order-name"
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Pedido"
          className="border p-2 rounded w-full mb-2"
        />
        <input
          id="order-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Preço do pedido"
          className="border p-2 rounded w-full mb-2"
        />
        <button
          id="add-order-button"
          onClick={addOrder}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
        >
          Adicionar
        </button>
      </div>
      <ul id="shared-order-list" className="mb-4">
        {sharedOrders.map((order, index) => (
          <li
            id={`shared-order-li-${index}`}
            key={index}
            className="flex items-center justify-between mb-2"
          >
            <span>
              {order.quantity} - {order.item}: {order.amount.toFixed(2)}
            </span>
            <button
              id={`increment-order-button-${index}`}
              onClick={() => incrementOrder(index)}
              className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 transition duration-200"
            >
              +
            </button>
          </li>
        ))}
      </ul>
      <h3 id="shared-amount" className="text-lg font-semibold">
        Total da comanda dividida: R${(totalAmount / people).toFixed(2)}
      </h3>
    </div>
  );
};

export default SharedOrder;
