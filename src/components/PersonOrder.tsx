import { useState } from "react";

interface PersonOrderProps {
  person: { name: string; orders: { item: string; amount: number }[] };
  personIndex: number;
  addOrder: (personIndex: number, item: string, amount: number) => void;
  calculateTotal: (orders: { item: string; amount: number }[]) => number;
  removePerson: (personIndex: number) => void;
}

const PersonOrder: React.FC<PersonOrderProps> = ({
  person,
  personIndex,
  addOrder,
  calculateTotal,
  removePerson,
}) => {
  const [item, setItem] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const handleAddOrder = () => {
    addOrder(personIndex, item, amount);
    setItem("");
    setAmount(0);
  };

  return (
    <div
      id={`person-order-container-${personIndex}`}
      className="mb-4 p-4 border rounded-lg bg-white shadow-md relative"
    >
      <h3
        id={`person-order-name-${personIndex}`}
        className="text-lg font-semibold mb-2"
      >
        {person.name}
      </h3>
      <button
        id={`person-order-remove-button-${personIndex}`}
        onClick={() => removePerson(personIndex)}
        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-200"
      >
        Excluir
      </button>
      <input
        id={`person-order-item-name-${personIndex}`}
        type="text"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        placeholder="Item"
        className="border p-2 rounded w-full mb-2"
      />
      <input
        id={`person-order-item-amount-${personIndex}`}
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Valor"
        className="border p-2 rounded w-full mb-2"
      />
      <button
        id={`person-order-add-order-button-${personIndex}`}
        onClick={handleAddOrder}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 mb-2"
      >
        Adicionar
      </button>
      <ul>
        {person.orders.map((order, orderIndex) => (
          <li
            id={`person-order-list-${orderIndex}`}
            key={orderIndex}
            className="mb-1"
          >
            {order.item}: {order.amount.toFixed(2)}
          </li>
        ))}
      </ul>
      <h4
        id={`person-order-total-amount-${personIndex}`}
        className="text-md font-semibold mt-2"
      >
        Total do pedido: R${calculateTotal(person.orders).toFixed(2)}
      </h4>
    </div>
  );
};

export default PersonOrder;
