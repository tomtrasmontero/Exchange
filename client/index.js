import SHA256 from "crypto-js/sha256";
import "./index.scss";

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const privateKey = document.getElementById("private-key").value;
  const key = ec.keyFromPrivate(privateKey, 'hex');

  const body = {
    sender, amount, recipient
  };

  const payload = SHA256(JSON.stringify(body)).toString();
  const signature = key.sign(payload);
  const signedBody = JSON.stringify({...body, signedPayload: payload, signature: signature.toDER('hex'), publicKey: key.getPublic().encode('hex')});
  console.log(signedBody);
  const request = new Request(`${server}/send`, { method: 'POST', signedBody });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});
