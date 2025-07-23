document.getElementById('cryptoBookingForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const booking = {
    customer: form.customer.value,
    room: parseInt(form.room.value, 10),
    paymentAmount: parseFloat(form.paymentAmount.value),
    cryptoTxId: 'SIMULATED_TX_' + Date.now() // In real use, capture from wallet
  };

  const response = await fetch('http://localhost:3000/book-crypto', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(booking)
  });
  const result = await response.json();
  document.getElementById('confirmation').innerText = result.confirmation;
};
