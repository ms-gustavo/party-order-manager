import React from "react";

interface TotalOrderProps {
  sharedOrders: { item: string; amount: number }[];
  individualOrders: {
    name: string;
    orders: { item: string; amount: number }[];
  }[];
}

const TotalOrder: React.FC<TotalOrderProps> = ({
  sharedOrders,
  individualOrders,
}) => {
  const totalSharedOrders = sharedOrders.reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const totalIndividualOrders = individualOrders.reduce((acc, curr) => {
    return (
      acc + curr.orders.reduce((orderAcc, order) => orderAcc + order.amount, 0)
    );
  }, 0);

  const total = totalSharedOrders + totalIndividualOrders;

  return (
    <>
      <h2 className="text-xl font-bold mb-2">Conta total</h2>
      <p id="total-amount" className="text-lg font-semibold">
        R${total.toFixed(2)}
      </p>
    </>
  );
};

export default TotalOrder;
